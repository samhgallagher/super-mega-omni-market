<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Users — Admin' })

const { data: users, refresh } = await useFetch('/api/admin/users')

const resetModal = ref<{ open: boolean, userId: string, username: string } | null>(null)
const resetPassword = ref('')
const resetting = ref(false)
const resetError = ref('')

function openReset(userId: string, username: string) {
  resetModal.value = { open: true, userId, username }
  resetPassword.value = ''
  resetError.value = ''
}

async function submitReset() {
  if (!resetModal.value) return
  resetting.value = true
  resetError.value = ''
  try {
    await $fetch(`/api/admin/users/${resetModal.value.userId}/reset-password`, {
      method: 'POST',
      body: { password: resetPassword.value }
    })
    resetModal.value = null
    await refresh()
  }
  catch (e: any) { resetError.value = e.data?.message ?? 'Something went wrong.' }
  finally { resetting.value = false }
}

const togglingId = ref<string | null>(null)

async function toggleBan(userId: string, currentlyBanned: boolean) {
  togglingId.value = userId
  try {
    await $fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      body: { banned: !currentlyBanned }
    })
    await refresh()
  }
  finally { togglingId.value = null }
}

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Users</h1>
      <UBadge v-if="users?.length" :label="String(users.length)" color="neutral" variant="soft" />
    </div>

    <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
      <div v-if="!users?.length" class="p-8 text-sm text-muted text-center">
        No users yet.
      </div>
      <div v-for="user in users" :key="user.userId" class="flex items-center gap-3 p-4">
        <UAvatar :src="user.photo ?? undefined" :alt="user.username" size="sm" class="shrink-0" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <NuxtLink :to="`/users/${user.userId}`" class="font-medium text-sm hover:underline">
              {{ user.username }}
            </NuxtLink>
            <UBadge v-if="user.banned" label="Banned" color="error" variant="soft" size="xs" />
            <UBadge v-if="user.mustChangePassword" label="Must change password" color="warning" variant="soft" size="xs" />
          </div>
          <p class="text-xs text-muted mt-0.5">{{ user.email }} · ¤{{ formatBalance(user.balance) }} · joined {{ formatDate(user.createdAt) }}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UButton
            label="Reset password"
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-key-round"
            @click="openReset(user.userId, user.username)"
          />
          <UButton
            :label="user.banned ? 'Unban' : 'Ban'"
            size="sm"
            :color="user.banned ? 'neutral' : 'error'"
            variant="soft"
            :loading="togglingId === user.userId"
            @click="toggleBan(user.userId, user.banned)"
          />
        </div>
      </div>
    </div>

    <UModal v-if="resetModal" v-model:open="resetModal.open">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <h2 class="font-semibold">Reset password for {{ resetModal.username }}</h2>
          <p class="text-sm text-muted">The user will be required to set a new password on their next login.</p>
          <UAlert v-if="resetError" color="error" variant="soft" :description="resetError" />
          <UFormField label="Temporary password" hint="Minimum 6 characters">
            <UInput
              v-model="resetPassword"
              type="text"
              placeholder="Temporary password"
              class="w-full"
              @keyup.enter="resetPassword.length >= 6 && submitReset()"
            />
          </UFormField>
          <div class="flex gap-2 justify-end">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="resetModal = null" />
            <UButton
              label="Reset password"
              :disabled="resetPassword.length < 6"
              :loading="resetting"
              @click="submitReset"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
