<script setup lang="ts">
const route = useRoute()
const category = computed(() => route.query.category as string | undefined)

const { data: markets, pending } = await useFetch('/api/markets', {
  query: { category },
  watch: [category]
})
</script>

<template>
  <UContainer class="py-8">
    <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <USkeleton v-for="i in 8" :key="i" class="h-64 rounded-xl" />
    </div>

    <div v-else-if="markets?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <MarketCard v-for="market in markets" :key="market.id" :market="market" />
    </div>

    <div v-else class="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <UIcon name="i-lucide-bar-chart-2" class="size-10 text-muted" />
      <p class="font-medium">No markets yet</p>
      <p class="text-sm text-muted">Markets will appear here once an admin creates them.</p>
    </div>
  </UContainer>
</template>
