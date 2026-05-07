<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Moderation — Admin' })

const { data: pending, refresh } = await useFetch('/api/admin/markets/pending')

const actingId = ref<string | null>(null)
const error = ref('')

async function approve(id: string) {
  actingId.value = id
  error.value = ''
  try {
    await $fetch(`/api/admin/markets/${id}/approve`, { method: 'POST' })
    await refresh()
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { actingId.value = null }
}

async function reject(id: string) {
  actingId.value = id
  error.value = ''
  try {
    await $fetch(`/api/admin/markets/${id}/reject`, { method: 'POST' })
    await refresh()
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { actingId.value = null }
}

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Moderation Queue</h1>
      <UBadge v-if="pending?.length" :label="String(pending.length)" color="warning" variant="soft" />
    </div>

    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
      <div v-if="!pending?.length" class="p-8 text-sm text-muted text-center">
        No markets pending review.
      </div>
      <div v-for="market in pending" :key="market.id" class="p-4 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <div class="size-12 rounded-lg overflow-hidden bg-(--ui-bg-muted) shrink-0 flex items-center justify-center">
            <img v-if="market.photo" :src="market.photo" alt="" class="w-full h-full object-cover" />
            <UIcon v-else name="i-lucide-trending-up" class="size-5 text-muted" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm">{{ market.title }}</p>
            <p v-if="market.description" class="text-xs text-muted mt-0.5 line-clamp-2">{{ market.description }}</p>
            <div class="flex flex-wrap gap-1.5 mt-1.5">
              <UBadge
                v-for="label in market.outcomes"
                :key="label"
                :label="label"
                color="neutral"
                variant="soft"
                size="xs"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-muted">
          <div class="flex items-center gap-2">
            <NuxtLink :to="`/users/${market.creatorId}`" class="flex items-center gap-1.5 hover:underline">
              <UAvatar :src="market.creatorPhoto ?? undefined" :alt="market.creatorUsername" size="2xs" />
              <span>{{ market.creatorUsername }}</span>
            </NuxtLink>
            <span>·</span>
            <span>¤{{ market.liquidityStaked.toLocaleString() }} stake</span>
            <span>·</span>
            <span>{{ market.feePercent }}% fee</span>
            <template v-if="market.expiresAt">
              <span>·</span>
              <span>Expires {{ formatDate(market.expiresAt) }}</span>
            </template>
          </div>
          <span>{{ formatDate(market.createdAt) }}</span>
        </div>

        <div class="flex gap-2">
          <UButton
            label="Approve"
            color="success"
            variant="soft"
            size="sm"
            :loading="actingId === market.id"
            @click="approve(market.id)"
          />
          <UButton
            label="Reject"
            color="error"
            variant="soft"
            size="sm"
            :loading="actingId === market.id"
            @click="reject(market.id)"
          />
          <UButton
            :to="`/markets/${market.id}`"
            label="Preview"
            color="neutral"
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-external-link"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>
