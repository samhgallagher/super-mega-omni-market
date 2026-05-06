<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { data } = useFetch('/api/categories')

const categories = computed(() => [
  { slug: 'all', label: 'All' },
  ...(data.value ?? [])
])

const active = computed(() => (route.query.category as string) || 'all')

function select(slug: string) {
  router.push({ path: '/', query: slug === 'all' ? {} : { category: slug } })
}
</script>

<template>
  <div class="border-b border-(--ui-border) bg-background/75 backdrop-blur sticky top-(--header-height) z-10">
    <UContainer>
      <div class="flex gap-1 overflow-x-auto py-2 no-scrollbar">
        <UButton
          v-for="cat in categories"
          :key="cat.slug"
          :label="cat.label"
          size="sm"
          :color="active === cat.slug ? 'primary' : 'neutral'"
          :variant="active === cat.slug ? 'soft' : 'ghost'"
          @click="select(cat.slug)"
        />
      </div>
    </UContainer>
  </div>
</template>
