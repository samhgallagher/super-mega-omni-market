<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Change Password — SMOM' })

const { fetch: refreshSession } = useUserSession()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

const mismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value)
const canSubmit = computed(() => password.value.length >= 8 && password.value === confirm.value)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/change-password', { method: 'POST', body: { password: password.value } })
    await refreshSession()
    await navigateTo('/')
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-16 max-w-sm flex flex-col gap-6">
    <div class="text-center flex flex-col gap-2">
      <UIcon name="i-lucide-lock-keyhole" class="size-10 mx-auto text-warning" />
      <h1 class="text-2xl font-bold">Set a new password</h1>
      <p class="text-sm text-muted">Your password has been reset by an admin. Please choose a new password to continue.</p>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <div class="flex flex-col gap-4">
      <UFormField label="New password" hint="At least 8 characters">
        <UInput
          v-model="password"
          type="password"
          placeholder="New password"
          class="w-full"
          @keyup.enter="canSubmit && submit()"
        />
      </UFormField>

      <UFormField label="Confirm password" :error="mismatch ? 'Passwords do not match' : undefined">
        <UInput
          v-model="confirm"
          type="password"
          placeholder="Confirm password"
          class="w-full"
          @keyup.enter="canSubmit && submit()"
        />
      </UFormField>

      <UButton block :loading="loading" :disabled="!canSubmit" @click="submit">
        Set Password
      </UButton>
    </div>
  </UContainer>
</template>
