<script setup lang="ts">
const route = useRoute()
const userId = route.params.userId as string

const { data, error: fetchError } = await useFetch(`/api/users/${userId}/positions`)

if (fetchError.value) {
  throw createError({ statusCode: 404, message: 'User not found.' })
}

useSeoMeta({ title: () => data.value ? `${data.value.username}'s Positions — SMOM` : 'Positions — SMOM' })

const positions = computed(() => data.value?.positions ?? [])
const active = computed(() => positions.value.filter(p => !p.resolved))
const claimable = computed(() => positions.value.filter(p => p.won && !p.redeemed))
const settled = computed(() => positions.value.filter(p => p.resolved && (!p.won || p.redeemed)))
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-8">
    <div class="flex items-center gap-4">
      <UAvatar :src="data?.photo ?? undefined" :alt="data?.username" size="lg" />
      <div>
        <h1 class="text-2xl font-bold">{{ data?.username }}</h1>
        <p class="text-sm text-muted">Positions</p>
      </div>
    </div>

    <div v-if="!positions.length" class="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <UIcon name="i-lucide-wallet" class="size-10 text-muted" />
      <p class="font-medium">No positions yet</p>
      <p class="text-sm text-muted">This user hasn't bought any shares yet.</p>
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
              <p class="text-sm font-semibold text-success tabular-nums">+¤{{ formatBalance(pos.payout) }}</p>
              <UBadge label="Won" color="success" variant="soft" size="xs" />
            </div>
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
