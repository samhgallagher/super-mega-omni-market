<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Create Market — SMOM' })

const { user, fetch: refreshSession } = useUserSession()
const { data: settings } = await useFetch('/api/community/settings')

const minLiquidity = computed(() => settings.value?.communityMinLiquidity ?? 100)
const defaultFeePercent = computed(() => settings.value?.communityFeePercent ?? 0)

const state = reactive({
  title: '',
  description: '',
  photo: '',
  expiresAt: '',
  feePercent: defaultFeePercent.value
})

watch(defaultFeePercent, val => { state.feePercent = val })

const outcomes = ref(['', ''])
const loading = ref(false)
const error = ref('')

function addOutcome() { outcomes.value.push('') }
function removeOutcome(i: number) { outcomes.value.splice(i, 1) }

const validOutcomes = computed(() => outcomes.value.filter(o => o.trim()))
const canAfford = computed(() => (user.value?.balance ?? 0) >= minLiquidity.value)
const canSubmit = computed(() => state.title.trim() && validOutcomes.value.length >= 2 && canAfford.value)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { id } = await $fetch('/api/markets', {
      method: 'POST',
      body: {
        title: state.title,
        description: state.description || undefined,
        photo: state.photo || undefined,
        expiresAt: state.expiresAt ? new Date(state.expiresAt).getTime() : undefined,
        feePercent: state.feePercent,
        outcomes: validOutcomes.value
      }
    })
    await refreshSession()
    await navigateTo(`/markets/${id}`)
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6 max-w-lg">
    <div class="flex items-center gap-3">
      <UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Create Community Market</h1>
    </div>

    <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-muted) p-4 flex flex-col gap-1.5 text-sm">
      <div class="flex justify-between">
        <div>
          <span class="text-muted">Liquidity stake</span>
          <p class="text-xs text-muted/70 mt-0.5">Deducted from your balance to seed the market. Refunded if rejected, otherwise locked permanently into the pool.</p>
        </div>
        <span class="font-semibold tabular-nums ml-6 shrink-0">¤{{ minLiquidity.toLocaleString() }}</span>
      </div>
      <div class="flex items-start justify-between gap-6 border-t border-(--ui-border) pt-3">
        <div class="flex-1">
          <span class="text-muted">Creator fee</span>
          <p class="text-xs text-muted/70 mt-0.5">Charged on every trade. Paid to you at market resolution.</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <UInput
            v-model.number="state.feePercent"
            type="number"
            :min="0"
            :max="100"
            step="0.1"
            class="w-20"
            size="sm"
          />
          <span class="text-muted text-sm">%</span>
        </div>
      </div>
      <div class="flex justify-between border-t border-(--ui-border) pt-1.5 mt-0.5">
        <span class="text-muted">Your balance</span>
        <span class="font-semibold tabular-nums" :class="canAfford ? '' : 'text-error'">
          ¤{{ formatBalance(user?.balance ?? 0) }}
        </span>
      </div>
    </div>

    <UAlert
      v-if="!canAfford"
      color="error"
      variant="soft"
      :description="`You need at least ¤${minLiquidity.toLocaleString()} to create a market.`"
    />
    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <UForm :state="state" class="flex flex-col gap-4" @submit="submit">
      <UFormField label="Title" name="title">
        <UInput v-model="state.title" placeholder="Will X happen by Y?" class="w-full" />
      </UFormField>

      <UFormField label="Description" name="description" hint="Optional">
        <UTextarea v-model="state.description" placeholder="Provide context for this market..." :rows="3" class="w-full" />
      </UFormField>

      <UFormField label="Photo URL" name="photo" hint="Optional">
        <UInput v-model="state.photo" placeholder="https://..." class="w-full" />
      </UFormField>

      <UFormField label="Expiry" name="expiresAt" hint="Optional">
        <UInput v-model="state.expiresAt" type="datetime-local" class="w-full" />
      </UFormField>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Outcomes</label>
        <div v-for="(_, i) in outcomes" :key="i" class="flex gap-2">
          <UInput v-model="outcomes[i]" :placeholder="`Outcome ${i + 1}`" class="flex-1" />
          <UButton
            v-if="outcomes.length > 2"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="removeOutcome(i)"
          />
        </div>
        <UButton
          label="Add outcome"
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          class="self-start"
          @click="addOutcome"
        />
      </div>

      <UButton type="submit" block :loading="loading" :disabled="!canSubmit">
        Submit for Review
      </UButton>
    </UForm>

    <p class="text-xs text-muted text-center">
      Your market will be reviewed before going live. The ¤{{ minLiquidity.toLocaleString() }} stake is
      refunded if rejected, or locked into the market pool if approved.
    </p>
  </UContainer>
</template>
