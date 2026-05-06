<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Categories — Admin' })

const { data: categories, refresh } = await useFetch('/api/categories')

const newLabel = ref('')
const adding = ref(false)
const addError = ref('')
const deletingSlug = ref<string | null>(null)

async function addCategory() {
  addError.value = ''
  adding.value = true
  try {
    await $fetch('/api/admin/categories', { method: 'POST', body: { label: newLabel.value } })
    newLabel.value = ''
    await refresh()
  }
  catch (e: any) { addError.value = e.data?.message ?? 'Something went wrong.' }
  finally { adding.value = false }
}

async function deleteCategory(slug: string) {
  deletingSlug.value = slug
  try {
    await $fetch(`/api/admin/categories/${slug}`, { method: 'DELETE' })
    await refresh()
  }
  finally { deletingSlug.value = null }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6 max-w-lg">
    <div class="flex items-center gap-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Categories</h1>
    </div>

    <div class="flex gap-2">
      <UInput v-model="newLabel" placeholder="Category name" class="flex-1" @keydown.enter="addCategory" />
      <UButton label="Add" :loading="adding" :disabled="!newLabel.trim()" @click="addCategory" />
    </div>
    <UAlert v-if="addError" color="error" variant="soft" :description="addError" />

    <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
      <div v-if="!categories?.length" class="p-4 text-sm text-muted text-center">
        No categories yet.
      </div>
      <div v-for="cat in categories" :key="cat.slug" class="flex items-center justify-between p-4">
        <div>
          <p class="font-medium text-sm">{{ cat.label }}</p>
          <p class="text-xs text-muted">{{ cat.slug }}</p>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :loading="deletingSlug === cat.slug"
          @click="deleteCategory(cat.slug)"
        />
      </div>
    </div>
  </UContainer>
</template>
