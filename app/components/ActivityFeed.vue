<script setup lang="ts">
defineProps<{
  activity: Array<{
    timestamp: number
    username: string
    photo: string | null
    outcomeLabel: string
    shares: number
    type: 'buy' | 'sell'
  }>
}>()

function timeAgo(epoch: number): string {
  const seconds = Math.floor((Date.now() - epoch) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
</script>

<template>
  <div v-if="activity.length" class="flex flex-col divide-y divide-(--ui-border) max-h-80 overflow-y-auto">
    <div v-for="(item, i) in activity" :key="i" class="flex items-center gap-3 py-3 px-1">
      <UAvatar :src="item.photo ?? undefined" :alt="item.username" size="xs" class="shrink-0" />
      <div class="flex-1 min-w-0 text-sm">
        <span class="font-medium">{{ item.username }}</span>
        <span class="text-muted">
          {{ item.type === 'buy' ? ' bought ' : ' sold ' }}
        </span>
        <span class="font-medium tabular-nums">{{ item.shares }}</span>
        <span class="text-muted"> {{ item.shares === 1 ? 'share' : 'shares' }} of </span>
        <span class="font-medium">{{ item.outcomeLabel }}</span>
      </div>
      <span class="text-xs text-muted shrink-0">{{ timeAgo(item.timestamp) }}</span>
    </div>
  </div>
  <p v-else class="text-sm text-muted text-center py-6">No trades yet.</p>
</template>
