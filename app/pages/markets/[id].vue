<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: market, error, refresh: refreshMarket } = await useFetch(`/api/markets/${id}`)
const { data: history, refresh: refreshHistory } = await useFetch(`/api/markets/${id}/history`)
const { data: myPositions, refresh: refreshPositions } = await useFetch(`/api/markets/${id}/position`)
const { data: activity, refresh: refreshActivity } = await useFetch(`/api/markets/${id}/activity`)

if (error.value) throw createError({ statusCode: 404, statusMessage: 'Market not found.' })

useSeoMeta({ title: () => market.value?.title ?? 'Market' })

const positionMap = computed(() => {
  const map: Record<string, number> = {}
  for (const p of myPositions.value ?? []) map[p.outcomeId] = p.shares
  return map
})

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function onTraded() {
  await Promise.all([refreshMarket(), refreshHistory(), refreshPositions(), refreshActivity()])
}
</script>

<template>
  <UContainer class="py-8">
    <UButton
      to="/"
      icon="i-lucide-arrow-left"
      label="Markets"
      color="neutral"
      variant="ghost"
      class="mb-6"
    />

    <div class="flex gap-5 items-start mb-8">
      <div class="size-32 sm:size-40 rounded-xl overflow-hidden bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center shrink-0">
        <img v-if="market?.photo" :src="market.photo" alt="" class="w-full h-full object-cover" />
        <UIcon v-else name="i-lucide-trending-up" class="size-10 text-navy-400" />
      </div>
      <div class="flex flex-col gap-2 pt-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge :label="market?.category" color="neutral" variant="soft" />
          <UBadge v-if="market?.resolved" label="Resolved" color="success" variant="soft" />
          <span v-if="market?.expiresAt" class="text-sm text-muted">
            Expires {{ formatDate(market.expiresAt) }}
          </span>
        </div>
        <h1 class="text-2xl font-bold leading-tight">{{ market?.title }}</h1>
        <p v-if="market?.description" class="text-sm text-muted leading-relaxed">{{ market.description }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-xl border border-(--ui-border) p-6">
          <h2 class="font-semibold mb-4">Outcomes</h2>
          <div class="flex flex-col gap-4">
            <div
              v-for="outcome in market?.outcomes"
              :key="outcome.id"
              class="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors"
              :class="market?.resolved && outcome.id === market.resolvedOutcomeId
                ? 'bg-success/8'
                : market?.resolved ? 'opacity-40' : ''"
            >
              <div class="w-28 shrink-0">
                <div class="flex items-center gap-1.5">
                  <UIcon
                    v-if="market?.resolved && outcome.id === market.resolvedOutcomeId"
                    name="i-lucide-check-circle-2"
                    class="size-4 text-success shrink-0"
                  />
                  <p class="text-sm truncate font-medium">{{ outcome.label }}</p>
                </div>
                <p v-if="positionMap[outcome.id]" class="text-xs text-primary font-medium tabular-nums mt-0.5">
                  {{ positionMap[outcome.id] }} shares
                </p>
              </div>
              <div class="flex-1 h-2 bg-(--ui-bg-muted) rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="market?.resolved && outcome.id === market.resolvedOutcomeId ? 'bg-success' : 'bg-primary'"
                  :style="{ width: `${(outcome.price * 100).toFixed(1)}%` }"
                />
              </div>
              <span class="text-sm font-semibold tabular-nums w-10 text-right shrink-0">
                {{ (outcome.price * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-(--ui-border) p-6">
          <h2 class="font-semibold mb-4">Price History</h2>
          <ClientOnly>
            <PriceChart
              :history="history ?? []"
              :outcomes="market?.outcomes ?? []"
            />
          </ClientOnly>
        </div>

        <div class="rounded-xl border border-(--ui-border) p-6">
          <h2 class="font-semibold mb-4">Activity</h2>
          <ActivityFeed :activity="activity ?? []" />
        </div>
      </div>

      <div>
        <TradePanel v-if="market" :market="market" :user-positions="positionMap" @traded="onTraded" />
      </div>
    </div>
  </UContainer>
</template>
