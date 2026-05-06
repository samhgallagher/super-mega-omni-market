<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'My Positions — SMOM' })

const { fetch: refreshSession } = useUserSession()

const { data: positions, refresh } = await useFetch('/api/positions')

const claimable = computed(() => positions.value?.filter(p => p.won && !p.redeemed) ?? [])
const active = computed(() => positions.value?.filter(p => !p.resolved) ?? [])
const settled = computed(() => positions.value?.filter(p => p.resolved && (!p.won || p.redeemed)) ?? [])

const redeeming = ref<string | null>(null)
const error = ref('')

async function redeem(marketId: string, outcomeId: string) {
  const key = `${marketId}#${outcomeId}`
  redeeming.value = key
  error.value = ''
  try {
    await $fetch('/api/positions/redeem', { method: 'POST', body: { marketId, outcomeId } })
    await Promise.all([refresh(), refreshSession()])
  }
  catch (e: any) {
    error.value = e.data?.message ?? 'Something went wrong.'
  }
  finally {
    redeeming.value = null
  }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-8">
    <h1 class="text-2xl font-bold">My Positions</h1>

    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <div v-if="!positions?.length" class="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <UIcon name="i-lucide-wallet" class="size-10 text-muted" />
      <p class="font-medium">No positions yet</p>
      <p class="text-sm text-muted">Buy shares in a market to see your positions here.</p>
      <UButton to="/" label="Browse markets" class="mt-2" />
    </div>

    <template v-else>
      <section v-if="claimable.length">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Ready to claim</h2>
        <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
          <div v-for="pos in claimable" :key="`${pos.marketId}#${pos.outcomeId}`" class="flex items-center gap-4 p-4">
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/markets/${pos.marketId}`" class="font-medium text-sm hover:underline line-clamp-1">
                {{ pos.marketTitle }}
              </NuxtLink>
              <p class="text-sm text-muted mt-0.5">{{ pos.outcomeLabel }} · {{ pos.shares }} shares</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-success tabular-nums">+¤{{ pos.payout.toLocaleString() }}</p>
              <UBadge label="Won" color="success" variant="soft" size="xs" />
            </div>
            <UButton
              label="Claim"
              size="sm"
              :loading="redeeming === `${pos.marketId}#${pos.outcomeId}`"
              @click="redeem(pos.marketId, pos.outcomeId)"
            />
          </div>
        </div>
      </section>

      <section v-if="active.length">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Active</h2>
        <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
          <div v-for="pos in active" :key="`${pos.marketId}#${pos.outcomeId}`" class="flex items-center gap-4 p-4">
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/markets/${pos.marketId}`" class="font-medium text-sm hover:underline line-clamp-1">
                {{ pos.marketTitle }}
              </NuxtLink>
              <p class="text-sm text-muted mt-0.5">{{ pos.outcomeLabel }} · {{ pos.shares }} shares</p>
            </div>
            <div class="text-right shrink-0 flex flex-col items-end gap-1">
              <span class="text-sm font-semibold tabular-nums">{{ (pos.currentPrice * 100).toFixed(0) }}%</span>
              <span class="text-xs text-muted tabular-nums">Sell value ¤{{ pos.sellValue.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="settled.length">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Settled</h2>
        <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
          <div v-for="pos in settled" :key="`${pos.marketId}#${pos.outcomeId}`" class="flex items-center gap-4 p-4">
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/markets/${pos.marketId}`" class="font-medium text-sm hover:underline line-clamp-1">
                {{ pos.marketTitle }}
              </NuxtLink>
              <p class="text-sm text-muted mt-0.5">{{ pos.outcomeLabel }} · {{ pos.shares }} shares</p>
            </div>
            <div class="shrink-0">
              <UBadge v-if="pos.redeemed" label="Redeemed" color="neutral" variant="soft" size="xs" />
              <UBadge v-else label="Lost" color="error" variant="soft" size="xs" />
            </div>
          </div>
        </div>
      </section>
    </template>
  </UContainer>
</template>
