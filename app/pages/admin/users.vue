<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Users — Admin' })

const { data: users, refresh } = await useFetch('/api/admin/users')

// ── Password reset ──────────────────────────────────────────
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

// ── Ban ─────────────────────────────────────────────────────
const togglingId = ref<string | null>(null)

async function toggleBan(userId: string, currentlyBanned: boolean) {
  togglingId.value = userId
  try {
    await $fetch(`/api/admin/users/${userId}/ban`, { method: 'POST', body: { banned: !currentlyBanned } })
    await refresh()
  }
  finally { togglingId.value = null }
}

// ── Manage modal ─────────────────────────────────────────────
type UserRow = NonNullable<typeof users.value>[number]

const manageModal = ref(false)
const managingUser = ref<UserRow | null>(null)
const manageError = ref('')

const scratcherData = ref<{
  paidUsedToday: number
  dailyLimit: number
  usedFreeToday: boolean
  paidTicketIds: string[]
  freeTicketId: string | null
} | null>(null)
const scratcherLoading = ref(false)

const balanceInput = ref(0)
const savingBalance = ref(false)
const resettingScratchers = ref<'paid' | 'free' | null>(null)

async function openManage(user: UserRow) {
  managingUser.value = user
  balanceInput.value = user.balance
  manageError.value = ''
  scratcherData.value = null
  manageModal.value = true
  scratcherLoading.value = true
  try {
    scratcherData.value = await $fetch(`/api/admin/users/${user.userId}/scratchers`)
  }
  finally { scratcherLoading.value = false }
}

async function saveBalance() {
  if (!managingUser.value) return
  savingBalance.value = true
  manageError.value = ''
  try {
    const { balance } = await $fetch(`/api/admin/users/${managingUser.value.userId}/balance`, {
      method: 'PATCH',
      body: { balance: balanceInput.value }
    })
    managingUser.value = { ...managingUser.value, balance }
    await refresh()
  }
  catch (e: any) { manageError.value = e.data?.message ?? 'Something went wrong.' }
  finally { savingBalance.value = false }
}

async function resetScratchers(type: 'paid' | 'free') {
  if (!managingUser.value) return
  resettingScratchers.value = type
  manageError.value = ''
  try {
    await $fetch(`/api/admin/users/${managingUser.value.userId}/scratchers/reset`, {
      method: 'POST',
      body: { type }
    })
    scratcherData.value = await $fetch(`/api/admin/users/${managingUser.value.userId}/scratchers`)
  }
  catch (e: any) { manageError.value = e.data?.message ?? 'Something went wrong.' }
  finally { resettingScratchers.value = null }
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
            label="Manage"
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-settings-2"
            @click="openManage(user)"
          />
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

    <!-- Manage modal -->
    <UModal v-model:open="manageModal">
      <template #content>
        <div v-if="managingUser" class="p-6 flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <UAvatar :src="managingUser.photo ?? undefined" :alt="managingUser.username" size="sm" />
            <div>
              <p class="font-semibold">{{ managingUser.username }}</p>
              <p class="text-xs text-muted">{{ managingUser.email }}</p>
            </div>
          </div>

          <UAlert v-if="manageError" color="error" variant="soft" :description="manageError" />

          <!-- Balance -->
          <div class="flex flex-col gap-3">
            <p class="text-sm font-medium">Balance</p>
            <div class="flex gap-2">
              <UInput
                v-model.number="balanceInput"
                type="number"
                :min="0"
                step="0.01"
                class="flex-1"
              >
                <template #leading><span class="text-muted text-sm">¤</span></template>
              </UInput>
              <UButton
                label="Save"
                :loading="savingBalance"
                @click="saveBalance"
              />
            </div>
            <p class="text-xs text-muted">Current: ¤{{ formatBalance(managingUser.balance) }}</p>
          </div>

          <!-- Scratchers -->
          <div class="flex flex-col gap-3">
            <p class="text-sm font-medium">Today's Scratchers</p>

            <div v-if="scratcherLoading" class="text-sm text-muted">Loading...</div>
            <template v-else-if="scratcherData">
              <div class="rounded-lg border border-(--ui-border) divide-y divide-(--ui-border)">
                <!-- Paid -->
                <div class="flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm">Paid scratchers used</p>
                    <p class="text-xs text-muted mt-0.5">
                      {{ scratcherData.paidUsedToday }} / {{ scratcherData.dailyLimit }} used today
                    </p>
                  </div>
                  <UButton
                    label="Reset"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    :disabled="scratcherData.paidUsedToday === 0"
                    :loading="resettingScratchers === 'paid'"
                    @click="resetScratchers('paid')"
                  />
                </div>

                <!-- Free -->
                <div class="flex items-center justify-between px-4 py-3">
                  <div>
                    <p class="text-sm">Free daily scratcher</p>
                    <p class="text-xs text-muted mt-0.5">
                      {{ scratcherData.usedFreeToday ? 'Claimed today' : 'Not yet claimed' }}
                    </p>
                  </div>
                  <UButton
                    label="Reset"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    :disabled="!scratcherData.usedFreeToday"
                    :loading="resettingScratchers === 'free'"
                    @click="resetScratchers('free')"
                  />
                </div>
              </div>
            </template>
          </div>

          <div class="flex justify-end">
            <UButton label="Close" color="neutral" variant="ghost" @click="manageModal = false" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Password reset modal -->
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
