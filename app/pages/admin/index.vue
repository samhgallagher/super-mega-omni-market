<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Admin — SMOM' })

const { data: markets, refresh } = await useFetch('/api/admin/markets')
const { data: pending } = await useFetch('/api/admin/markets/pending')

const resolveModal = ref<{ open: boolean, market: NonNullable<typeof markets.value>[number] | null }>({
  open: false,
  market: null
})

function openResolve(market: NonNullable<typeof markets.value>[number]) {
  resolveModal.value = { open: true, market }
}

const resolving = ref(false)
const resolveError = ref('')

async function resolve(outcomeId: string) {
  if (!resolveModal.value.market) return
  resolving.value = true
  resolveError.value = ''
  try {
    await $fetch(`/api/admin/markets/${resolveModal.value.market.id}/resolve`, {
      method: 'POST',
      body: { outcomeId }
    })
    resolveModal.value.open = false
    await refresh()
  }
  catch (e: any) { resolveError.value = e.data?.message ?? 'Something went wrong.' }
  finally { resolving.value = false }
}

const togglingId = ref<string | null>(null)

async function toggleHidden(market: NonNullable<typeof markets.value>[number]) {
  togglingId.value = market.id
  try {
    await $fetch(`/api/admin/markets/${market.id}/hide`, {
      method: 'POST',
      body: { hidden: !market.hidden }
    })
    await refresh()
  }
  finally { togglingId.value = null }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Admin</h1>
      <div class="flex gap-2 flex-wrap">
        <UButton to="/admin/settings" label="Settings" color="neutral" variant="ghost" icon="i-lucide-settings" />
        <UButton to="/admin/categories" label="Categories" color="neutral" variant="outline" icon="i-lucide-tag" />
        <UButton to="/admin/moderation" label="Moderation" color="neutral" variant="outline" icon="i-lucide-shield-check">
          <template v-if="pending?.length" #trailing>
            <UBadge :label="String(pending.length)" color="warning" variant="solid" size="xs" />
          </template>
        </UButton>
        <UButton to="/admin/markets/create" label="New Market" icon="i-lucide-plus" />
      </div>
    </div>

    <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
      <div v-if="!markets?.length" class="p-8 text-sm text-muted text-center">
        No markets yet. Create one to get started.
      </div>
      <div v-for="market in markets" :key="market.id" class="flex items-center gap-3 p-4">
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/markets/${market.id}`" class="font-medium text-sm hover:underline line-clamp-1">
            {{ market.title }}
          </NuxtLink>
          <p class="text-xs text-muted mt-0.5">{{ market.category }}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UBadge v-if="market.hidden" label="Hidden" color="neutral" variant="outline" size="xs" />
          <UBadge
            :label="market.resolved ? 'Resolved' : 'Active'"
            :color="market.resolved ? 'neutral' : 'success'"
            variant="soft"
            size="xs"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UButton
            v-if="market.resolved"
            :label="market.hidden ? 'Unhide' : 'Hide'"
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="togglingId === market.id"
            @click="toggleHidden(market)"
          />
          <UButton
            v-if="!market.resolved"
            label="Resolve"
            size="sm"
            color="neutral"
            variant="outline"
            @click="openResolve(market)"
          />
        </div>
      </div>
    </div>

    <UModal v-model:open="resolveModal.open">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h2 class="font-semibold">Resolve Market</h2>
          <p class="text-sm text-muted line-clamp-2">{{ resolveModal.market?.title }}</p>
          <p class="text-sm">Select the winning outcome:</p>
          <UAlert v-if="resolveError" color="error" variant="soft" :description="resolveError" />
          <div class="flex flex-col gap-2">
            <UButton
              v-for="outcome in resolveModal.market?.outcomes"
              :key="outcome.id"
              :label="outcome.label"
              color="neutral"
              variant="outline"
              :loading="resolving"
              @click="resolve(outcome.id)"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
