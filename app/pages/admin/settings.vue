<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Settings — Admin' })

const { data: settings, refresh } = await useFetch('/api/admin/settings')

const state = reactive({
  communityMinLiquidity: settings.value?.communityMinLiquidity ?? 100,
  communityFeePercent: settings.value?.communityFeePercent ?? 2.5
})

const loading = ref(false)
const error = ref('')
const saved = ref(false)

async function save() {
  error.value = ''
  saved.value = false
  loading.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: {
        communityMinLiquidity: state.communityMinLiquidity,
        communityFeePercent: state.communityFeePercent
      }
    })
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

    <div class="rounded-xl border border-(--ui-border) p-5 flex flex-col gap-5">
      <h2 class="font-semibold">Community Markets</h2>

      <UForm :state="state" class="flex flex-col gap-4" @submit="save">
        <UFormField
          label="Minimum Liquidity Stake"
          name="communityMinLiquidity"
          hint="Amount deducted from creator's balance on submission"
        >
          <UInput
            v-model.number="state.communityMinLiquidity"
            type="number"
            :min="1"
            class="w-full"
          >
            <template #leading>
              <span class="text-muted text-sm">¤</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField
          label="Creator Fee"
          name="communityFeePercent"
          hint="Taken from every trade on community markets, redeemable by creator after resolution"
        >
          <UInput
            v-model.number="state.communityFeePercent"
            type="number"
            :min="0"
            :max="100"
            step="0.1"
            class="w-full"
          >
            <template #trailing>
              <span class="text-muted text-sm">%</span>
            </template>
          </UInput>
        </UFormField>

        <UButton type="submit" :loading="loading" class="self-start">
          Save Settings
        </UButton>
      </UForm>
    </div>
  </UContainer>
</template>
