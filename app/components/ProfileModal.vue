<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const { user, fetch: refreshSession } = useUserSession()

const photoInput = ref('')
const loading = ref(false)
const error = ref('')

watch(open, (val) => {
  if (val) {
    photoInput.value = user.value?.photo ?? ''
    error.value = ''
  }
})

async function save() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/user/profile', { method: 'PATCH', body: { photo: photoInput.value } })
    await refreshSession()
    open.value = false
  }
  catch (e: any) {
    error.value = e.data?.message ?? 'Something went wrong.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="p-6 flex flex-col gap-5">
        <div class="flex items-start justify-between">
          <h2 class="text-lg font-semibold">Edit Profile Photo</h2>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="open = false" />
        </div>

        <div class="flex items-center gap-4">
          <UAvatar :src="photoInput || undefined" :alt="user?.username" size="xl" />
          <div class="flex flex-col gap-1">
            <p class="text-sm font-medium">{{ user?.username }}</p>
            <p class="text-xs text-muted">Paste a photo URL below to update your avatar.</p>
          </div>
        </div>

        <UAlert v-if="error" color="error" variant="soft" :description="error" />

        <UFormField label="Photo URL" hint="Leave blank to remove your photo">
          <UInput v-model="photoInput" placeholder="https://..." class="w-full" />
        </UFormField>

        <div class="flex gap-2 justify-end">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Save" :loading="loading" @click="save" />
        </div>
      </div>
    </template>
  </UModal>
</template>
