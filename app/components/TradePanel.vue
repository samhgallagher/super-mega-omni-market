<script setup lang="ts">
interface Outcome {
  id: string
  label: string
  shares: number
  price: number
}

interface Market {
  id: string
  liquidity: number
  resolved: boolean
  outcomes: Outcome[]
  feePercent?: number
}

const props = defineProps<{ market: Market, userPositions?: Record<string, number> }>()
const emit = defineEmits<{ traded: [] }>()

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { open } = useAuthModal()

const tradeType = ref<'buy' | 'sell'>('buy')
const selectedOutcomeId = ref(props.market.outcomes[0]?.id ?? '')
const sharesInput = ref(1)
const loading = ref(false)
const error = ref('')

const selectedOutcome = computed(() =>
  props.market.outcomes.find(o => o.id === selectedOutcomeId.value)
)

const currentShares = computed(() => props.market.outcomes.map(o => o.shares))
const outcomeIndex = computed(() => props.market.outcomes.findIndex(o => o.id === selectedOutcomeId.value))

const costPreview = computed(() => {
  if (!selectedOutcome.value || sharesInput.value <= 0) return 0
  const delta = tradeType.value === 'buy' ? sharesInput.value : -sharesInput.value
  return tradeCost(currentShares.value, outcomeIndex.value, delta, props.market.liquidity)
})

const feePreview = computed(() => {
  const pct = props.market.feePercent ?? 0
  return pct > 0 ? Math.abs(costPreview.value) * pct / 100 : 0
})

const totalCostPreview = computed(() =>
  Math.abs(costPreview.value) + feePreview.value
)

const newPricePreview = computed(() => {
  if (!selectedOutcome.value || sharesInput.value <= 0) return selectedOutcome.value?.price ?? 0
  const newShares = [...currentShares.value]
  newShares[outcomeIndex.value] += tradeType.value === 'buy' ? sharesInput.value : -sharesInput.value
  return computePrices(newShares, props.market.liquidity)[outcomeIndex.value]
})

const heldShares = computed(() => props.userPositions?.[selectedOutcomeId.value] ?? 0)

const canAfford = computed(() => {
  if (tradeType.value === 'sell') return heldShares.value >= sharesInput.value
  return (user.value?.balance ?? 0) >= totalCostPreview.value
})

watch(tradeType, () => { error.value = '' })
watch(selectedOutcomeId, () => { error.value = '' })

async function executeTrade() {
  error.value = ''
  loading.value = true
  try {
    await $fetch(`/api/markets/${props.market.id}/trade`, {
      method: 'POST',
      body: { outcomeId: selectedOutcomeId.value, shares: sharesInput.value, type: tradeType.value }
    })
    await refreshSession()
    emit('traded')
  }
  catch (e: any) {
    error.value = e.data?.message ?? 'Something went wrong.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-(--ui-border) p-5 sticky top-24 flex flex-col gap-4">
    <h2 class="font-semibold">Trade</h2>

    <div v-if="market.resolved" class="text-sm text-muted text-center py-4">
      This market has been resolved.
    </div>

    <template v-else-if="!loggedIn">
      <p class="text-sm text-muted">Sign in to buy and sell positions.</p>
      <UButton block label="Sign in" @click="open('signin')" />
    </template>

    <template v-else>
      <div class="flex gap-2">
        <UButton
          label="Buy"
          class="flex-1"
          :color="tradeType === 'buy' ? 'primary' : 'neutral'"
          :variant="tradeType === 'buy' ? 'solid' : 'outline'"
          @click="tradeType = 'buy'"
        />
        <UButton
          label="Sell"
          class="flex-1"
          :color="tradeType === 'sell' ? 'primary' : 'neutral'"
          :variant="tradeType === 'sell' ? 'solid' : 'outline'"
          @click="tradeType = 'sell'"
        />
      </div>

      <UFormField label="Outcome">
        <USelect
          v-model="selectedOutcomeId"
          :items="market.outcomes.map(o => ({ label: `${o.label} — ${(o.price * 100).toFixed(0)}%${(userPositions?.[o.id] ?? 0) > 0 ? ` · ${userPositions![o.id]} held` : ''}`, value: o.id }))"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Shares" :hint="tradeType === 'sell' && heldShares > 0 ? `${heldShares} available` : undefined">
        <UInput
          v-model.number="sharesInput"
          type="number"
          :min="1"
          :max="tradeType === 'sell' ? heldShares : undefined"
          class="w-full"
        />
      </UFormField>

      <div class="rounded-lg bg-(--ui-bg-muted) p-3 flex flex-col gap-1.5 text-sm">
        <div class="flex justify-between">
          <span class="text-muted">{{ tradeType === 'buy' ? 'Cost' : 'Proceeds' }}</span>
          <span class="font-semibold tabular-nums">¤{{ Math.abs(costPreview).toFixed(2) }}</span>
        </div>
        <div v-if="feePreview > 0" class="flex justify-between">
          <span class="text-muted">Creator fee ({{ market.feePercent }}%)</span>
          <span class="font-semibold tabular-nums text-warning">¤{{ feePreview.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">New probability</span>
          <span class="font-semibold tabular-nums">{{ (newPricePreview * 100).toFixed(1) }}%</span>
        </div>
        <div class="flex justify-between border-t border-(--ui-border) pt-1.5 mt-0.5">
          <span class="text-muted">Your balance</span>
          <span class="font-semibold tabular-nums">¤{{ formatBalance(user?.balance ?? 0) }}</span>
        </div>
      </div>

      <UAlert v-if="error" color="error" variant="soft" :description="error" />
      <UAlert v-else-if="tradeType === 'sell' && heldShares === 0" color="warning" variant="soft" description="You don't hold any shares in this outcome." />
      <UAlert v-else-if="!canAfford && tradeType === 'sell'" color="warning" variant="soft" :description="`You only hold ${heldShares} share${heldShares === 1 ? '' : 's'}.`" />
      <UAlert v-else-if="!canAfford" color="warning" variant="soft" description="Insufficient balance for this trade." />

      <UButton
        block
        :loading="loading"
        :disabled="!canAfford || sharesInput <= 0"
        @click="executeTrade"
      >
        {{ tradeType === 'buy' ? 'Buy' : 'Sell' }} {{ sharesInput }} {{ sharesInput === 1 ? 'share' : 'shares' }}
      </UButton>
    </template>
  </div>
</template>
