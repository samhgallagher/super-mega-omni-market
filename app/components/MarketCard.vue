<script setup lang="ts">
defineProps<{
  market: {
    id: string
    title: string
    photo: string | null
    category: string
    expiresAt: number | null
    resolved: boolean
    resolvedOutcomeId: string | null
    outcomes: Array<{ id: string, label: string, price: number }>
  }
}>()

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <NuxtLink :to="`/markets/${market.id}`" class="block group">
    <div class="rounded-xl border border-(--ui-border) bg-background overflow-hidden group-hover:shadow-md transition-shadow h-full flex flex-col">
      <div class="aspect-square bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center overflow-hidden shrink-0">
        <img v-if="market.photo" :src="market.photo" alt="" class="w-full h-full object-cover" />
        <UIcon v-else name="i-lucide-trending-up" class="size-8 text-navy-400" />
      </div>

      <div class="p-4 flex flex-col gap-3 flex-1">
        <div class="flex flex-col gap-1.5">
          <h3 class="font-semibold text-sm leading-snug line-clamp-2">{{ market.title }}</h3>
          <div class="flex items-center gap-1.5">
            <UBadge :label="market.category" color="neutral" variant="soft" size="xs" />
            <UBadge v-if="market.resolved" label="Resolved" color="success" variant="soft" size="xs" />
          </div>
        </div>

        <div class="flex flex-col gap-2 flex-1">
          <div
            v-for="outcome in market.outcomes"
            :key="outcome.id"
            class="flex items-center gap-2"
            :class="market.resolved && outcome.id !== market.resolvedOutcomeId ? 'opacity-40' : ''"
          >
            <div class="flex items-center gap-1 w-20 shrink-0">
              <UIcon
                v-if="market.resolved && outcome.id === market.resolvedOutcomeId"
                name="i-lucide-check-circle-2"
                class="size-3 text-success shrink-0"
              />
              <span class="text-xs text-muted truncate">{{ outcome.label }}</span>
            </div>
            <div class="flex-1 h-1.5 bg-(--ui-bg-muted) rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="market.resolved && outcome.id === market.resolvedOutcomeId ? 'bg-success' : 'bg-primary'"
                :style="{ width: `${(outcome.price * 100).toFixed(1)}%` }"
              />
            </div>
            <span class="text-xs font-semibold tabular-nums w-9 text-right shrink-0">
              {{ (outcome.price * 100).toFixed(0) }}%
            </span>
          </div>
        </div>

        <p class="text-xs text-muted">
          {{ market.expiresAt ? `Expires ${formatDate(market.expiresAt)}` : 'No expiry' }}
        </p>
      </div>
    </div>
  </NuxtLink>
</template>
