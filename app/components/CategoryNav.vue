<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { data } = useFetch('/api/categories')

const categories = computed(() => [
  { slug: 'all', label: 'All' },
  ...(data.value ?? []),
  { slug: 'community', label: 'Community' }
])

const active = computed(() => (route.query.category as string) || 'all')

function select(slug: string) {
  router.push({ path: '/', query: slug === 'all' ? {} : { category: slug } })
}

const rulesOpen = ref(false)
</script>

<template>
  <div class="border-b border-(--ui-border) bg-background/75 backdrop-blur sticky top-(--header-height) z-10">
    <UContainer>
      <div class="flex items-center gap-1 py-2">
        <div class="flex gap-1 overflow-x-auto no-scrollbar flex-1">
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
        <div class="shrink-0 pl-2 border-l border-(--ui-border) ml-1">
          <UButton label="Rules" size="sm" color="neutral" variant="ghost" @click="rulesOpen = true" />
        </div>
      </div>
    </UContainer>
  </div>

  <RulesModal v-model:open="rulesOpen" />
</template>
