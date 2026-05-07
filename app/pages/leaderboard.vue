<script setup lang="ts">
useSeoMeta({ title: 'Leaderboard — SMOM' })

const { data: entries } = await useFetch('/api/leaderboard')

const rankLabel: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
</script>

<template>
  <UContainer class="py-8 max-w-xl">
    <h1 class="text-2xl font-bold mb-6">Leaderboard</h1>

    <div class="flex flex-col divide-y divide-(--ui-border) rounded-xl border border-(--ui-border) overflow-hidden">
      <div v-if="!entries?.length" class="p-8 text-sm text-muted text-center">
        No users yet.
      </div>
      <NuxtLink
        v-for="entry in entries"
        :key="entry.userId"
        :to="`/users/${entry.userId}`"
        class="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-(--ui-bg-elevated) group"
        :class="entry.isCurrentUser ? 'bg-primary/5' : ''"
      >
        <div class="w-8 text-center shrink-0">
          <span v-if="rankLabel[entry.rank]" class="text-lg leading-none">{{ rankLabel[entry.rank] }}</span>
          <span v-else class="text-sm text-muted font-medium tabular-nums">{{ entry.rank }}</span>
        </div>

        <UAvatar :src="entry.photo ?? undefined" :alt="entry.username" size="sm" />

        <div class="flex-1 min-w-0 flex items-center gap-2">
          <span class="text-sm font-medium truncate group-hover:underline">{{ entry.username }}</span>
          <UBadge v-if="entry.isCurrentUser" label="you" color="primary" variant="soft" size="xs" />
        </div>

        <span class="text-sm font-semibold tabular-nums shrink-0">¤{{ formatBalance(entry.balance) }}</span>
      </NuxtLink>
    </div>
  </UContainer>
</template>
