<script setup>
const { open } = useAuthModal()
const { loggedIn, user, fetch: refreshSession } = useUserSession()

// Refresh session from DB if photo is missing (stale session from before photo was added)
onMounted(async () => {
  if (loggedIn.value) {
    await $fetch('/api/auth/me')
    await refreshSession()
  }
})

useHead({
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
})

useSeoMeta({
  title: 'SMOM',
  description: 'Super Mega Omni Market — a prediction market parody.',
  ogTitle: 'SMOM',
  ogDescription: 'Super Mega Omni Market — a prediction market parody.'
})

const profileModalOpen = ref(false)

async function signOut() {
  await $fetch('/api/auth/signout', { method: 'POST' })
  await refreshSession()
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo />
        </NuxtLink>
      </template>

      <template #right>
        <UButton label="Markets" to="/" color="neutral" variant="ghost" />
        <UButton label="Leaderboard" to="/leaderboard" color="neutral" variant="ghost" />
        <UButton label="Create Market" to="/markets/create" icon="i-lucide-plus" color="neutral" variant="ghost" class="hover:text-primary transition-colors" />

        <div class="h-5 w-px bg-(--ui-border) mx-1" />

        <template v-if="loggedIn">
          <button
            class="flex items-center gap-2.5 hover:opacity-75 transition-opacity cursor-pointer"
            @click="profileModalOpen = true"
          >
            <UAvatar :src="user.photo ?? undefined" :alt="user.username" size="sm" />
            <div class="leading-tight text-left">
              <p class="text-sm font-medium">{{ user.username }}</p>
              <p class="text-xs text-muted tabular-nums">¤{{ formatBalance(user.balance) }}</p>
            </div>
          </button>
          <UButton label="My Positions" to="/positions" color="neutral" variant="ghost" />
          <UButton v-if="user.isAdmin" label="Admin" to="/admin" color="neutral" variant="ghost" />
          <UButton label="Sign out" color="neutral" variant="ghost" @click="signOut" />
        </template>
        <template v-else>
          <UButton label="Sign in" color="neutral" variant="ghost" @click="open('signin')" />
          <UButton label="Sign up" @click="open('signup')" />
        </template>

      </template>
    </UHeader>

    <CategoryNav />
    <AuthModal />
    <ProfileModal v-model:open="profileModalOpen" />

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          SMOM · Super Mega Omni Market · {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
