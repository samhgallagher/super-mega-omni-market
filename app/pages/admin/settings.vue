<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Settings — Admin' })

const { data: settings, refresh } = await useFetch('/api/admin/settings')

const state = reactive({
  communityMinLiquidity: settings.value?.communityMinLiquidity ?? 100,
  communityFeePercent: settings.value?.communityFeePercent ?? 2.5,
  scratcherDailyLimit: settings.value?.scratcherDailyLimit ?? 3,
  scratcherWinOdds: settings.value?.scratcherWinOdds ?? 0.30,
  scratcherJackpotOdds: settings.value?.scratcherJackpotOdds ?? 0.002,
  scratcherWinMultiplier: settings.value?.scratcherWinMultiplier ?? 3,
  scratcherJackpotMultiplier: settings.value?.scratcherJackpotMultiplier ?? 100
})

const loading = ref(false)
const error = ref('')
const saved = ref(false)

const scratcherEV = computed(() => {
  const ev = state.scratcherWinOdds * state.scratcherWinMultiplier
    + state.scratcherJackpotOdds * state.scratcherJackpotMultiplier
  return Math.round(ev * 1000) / 10
})

async function save() {
  error.value = ''
  saved.value = false
  loading.value = true
  try {
    await $fetch('/api/admin/settings', { method: 'PATCH', body: { ...state } })
    await refresh()
    saved.value = true
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6 max-w-lg">
    <div class="flex items-center gap-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Settings</h1>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :description="error" />
    <UAlert v-if="saved" color="success" variant="soft" description="Settings saved." />

    <UForm :state="state" class="flex flex-col gap-5" @submit="save">
      <!-- Community Markets -->
      <div class="rounded-xl border border-(--ui-border) p-5 flex flex-col gap-4">
        <h2 class="font-semibold">Community Markets</h2>

        <UFormField label="Minimum Liquidity Stake" hint="Deducted from creator's balance on submission">
          <UInput v-model.number="state.communityMinLiquidity" type="number" :min="1" class="w-full">
            <template #leading><span class="text-muted text-sm">¤</span></template>
          </UInput>
        </UFormField>

        <UFormField label="Creator Fee" hint="Taken from every trade, redeemable after resolution">
          <UInput v-model.number="state.communityFeePercent" type="number" :min="0" :max="100" step="0.1" class="w-full">
            <template #trailing><span class="text-muted text-sm">%</span></template>
          </UInput>
        </UFormField>
      </div>

      <!-- Scratchers -->
      <div class="rounded-xl border border-(--ui-border) p-5 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Scratchers</h2>
          <UBadge
            :label="`${scratcherEV}% avg return`"
            :color="scratcherEV >= 100 ? 'success' : 'error'"
            variant="soft"
            size="sm"
          />
        </div>

        <UFormField label="Daily Limit" hint="Max tickets per user per day">
          <UInput v-model.number="state.scratcherDailyLimit" type="number" :min="1" :max="100" class="w-full" />
        </UFormField>

        <UFormField label="Win Odds" hint="Probability of matching all 3 (0–1)">
          <UInput v-model.number="state.scratcherWinOdds" type="number" :min="0" :max="1" step="0.01" class="w-full" />
        </UFormField>

        <UFormField label="Jackpot Odds" hint="Probability of 💎 jackpot (0–1, keep small)">
          <UInput v-model.number="state.scratcherJackpotOdds" type="number" :min="0" :max="1" step="0.001" class="w-full" />
        </UFormField>

        <UFormField label="Win Multiplier" hint="Prize = ticket price × this">
          <UInput v-model.number="state.scratcherWinMultiplier" type="number" :min="0" step="0.1" class="w-full">
            <template #trailing><span class="text-muted text-sm">×</span></template>
          </UInput>
        </UFormField>

        <UFormField label="Jackpot Multiplier" hint="Jackpot prize = ticket price × this">
          <UInput v-model.number="state.scratcherJackpotMultiplier" type="number" :min="0" step="1" class="w-full">
            <template #trailing><span class="text-muted text-sm">×</span></template>
          </UInput>
        </UFormField>

        <div class="rounded-lg bg-(--ui-bg-muted) p-3 text-xs text-muted flex flex-col gap-1">
          <p class="font-medium text-foreground">Prize preview</p>
          <div class="flex justify-between"><span>¤10 win / jackpot</span><span>¤{{ Math.round(10 * state.scratcherWinMultiplier * 100) / 100 }} / ¤{{ Math.round(10 * state.scratcherJackpotMultiplier * 100) / 100 }}</span></div>
          <div class="flex justify-between"><span>¤100 win / jackpot</span><span>¤{{ Math.round(100 * state.scratcherWinMultiplier * 100) / 100 }} / ¤{{ Math.round(100 * state.scratcherJackpotMultiplier * 100) / 100 }}</span></div>
          <div class="flex justify-between"><span>¤500 win / jackpot</span><span>¤{{ Math.round(500 * state.scratcherWinMultiplier * 100) / 100 }} / ¤{{ Math.round(500 * state.scratcherJackpotMultiplier * 100) / 100 }}</span></div>
        </div>
      </div>

      <UButton type="submit" :loading="loading" class="self-start">
        Save Settings
      </UButton>
    </UForm>
  </UContainer>
</template>
