<script setup lang="ts">
useSeoMeta({ title: 'Scratchers — SMOM' })

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { open: openAuth } = useAuthModal()

const { data, refresh } = await useFetch('/api/scratchers')

const settings = computed(() => data.value?.settings)
const ticketsToday = computed(() => data.value?.ticketsToday ?? 0)
const dailyLimit = computed(() => settings.value?.scratcherDailyLimit ?? 3)
const unscratched = computed(() => data.value?.unscratched ?? [])
const remaining = computed(() => Math.max(0, dailyLimit.value - ticketsToday.value))
const usedFreeToday = computed(() => data.value?.usedFreeToday ?? false)

const TIERS: Array<{ price: number, name: string, emoji: string, tagline: string }> = [
  { price: 10, name: "Grandpa's Holidy Scratcher", emoji: '👴', tagline: 'One for every grandchild' },
  { price: 100, name: 'Lucky 7s', emoji: '🎰', tagline: '"Don\'t worry, I\'ve got a system"' },
  { price: 500, name: 'Series A', emoji: '💵', tagline: 'Disrupt the markets' }
]

function winPrize(tier: number) {
  return Math.round(tier * (settings.value?.scratcherWinMultiplier ?? 3) * 100) / 100
}
function jackpotPrize(tier: number) {
  return Math.round(tier * (settings.value?.scratcherJackpotMultiplier ?? 100) * 100) / 100
}

// Active scratch state
const activeTicket = ref<{ id: string, tier: number, symbols: [string, string, string] } | null>(null)
const revealedCells = ref([false, false, false])
const result = ref<{ outcome: string, payout: number } | null>(null)
const buying = ref<number | 'free' | null>(null)
const buyError = ref('')
const revealing = ref(false)

function openUnscratched(ticket: { id: string, tier: number, symbols: [string, string, string] }) {
  activeTicket.value = ticket
  revealedCells.value = [false, false, false]
  result.value = null
}

async function buy(tier: number) {
  if (!loggedIn.value) { openAuth('signin'); return }
  buying.value = tier
  buyError.value = ''
  try {
    const ticket = await $fetch('/api/scratchers/buy', { method: 'POST', body: { tier } })
    await refreshSession()
    await refresh()
    activeTicket.value = { id: ticket.id, tier: ticket.tier, symbols: ticket.symbols }
    revealedCells.value = [false, false, false]
    result.value = null
    scrollToScratch()
  }
  catch (e: any) { buyError.value = e.data?.message ?? 'Something went wrong.' }
  finally { buying.value = null }
}

async function claimFree() {
  if (!loggedIn.value) { openAuth('signin'); return }
  buying.value = 'free'
  buyError.value = ''
  try {
    const ticket = await $fetch('/api/scratchers/buy-free', { method: 'POST' })
    await refresh()
    activeTicket.value = { id: ticket.id, tier: 0, symbols: ticket.symbols }
    revealedCells.value = [false, false, false]
    result.value = null
    scrollToScratch()
  }
  catch (e: any) { buyError.value = e.data?.message ?? 'Something went wrong.' }
  finally { buying.value = null }
}

const scratchRef = ref<HTMLElement | null>(null)
function scrollToScratch() {
  nextTick(() => scratchRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

function onCellRevealed(index: number) {
  revealedCells.value[index] = true
  if (revealedCells.value.every(Boolean)) onAllRevealed()
}

async function onAllRevealed() {
  if (!activeTicket.value || revealing.value) return
  revealing.value = true
  try {
    const res = await $fetch(`/api/scratchers/${activeTicket.value.id}/reveal`, { method: 'POST' })
    await refreshSession()
    result.value = { outcome: res.outcome, payout: res.payout }
    await refresh()
  }
  finally { revealing.value = false }
}

function closeResult() {
  activeTicket.value = null
  result.value = null
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-8 max-w-2xl">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Scratchers</h1>
      <div class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-ticket" class="size-4" />
        <span>
          <span :class="remaining === 0 ? 'text-error font-semibold' : 'font-semibold text-foreground'">{{ remaining
          }}</span>
          / {{ dailyLimit }} remaining today
        </span>
      </div>
    </div>

    <!-- Unscratched tickets from previous sessions -->
    <div v-if="unscratched.length" class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Unscratched</h2>
      <div class="flex flex-wrap gap-2">
        <UButton v-for="t in unscratched" :key="t.id" :label="t.tier === 0 ? 'Lucky Dip — unscratched' : `¤${t.tier} — unscratched`" icon="i-lucide-ticket"
          color="warning" variant="soft" size="sm" @click="openUnscratched(t)" />
      </div>
    </div>

    <!-- Active scratch card -->
    <div v-if="activeTicket" ref="scratchRef"
      class="rounded-xl border-2 border-(--ui-border) p-6 flex flex-col items-center gap-6 bg-(--ui-bg-elevated)">
      <div class="text-center">
        <p class="text-xs uppercase tracking-widest text-muted mb-1">{{ activeTicket.tier === 0 ? "Today's Lucky Dip" : (TIERS.find(t => t.price === activeTicket!.tier)?.name ?? `¤${activeTicket.tier} Scratcher`) }}</p>
        <p class="text-sm text-muted">
          {{ revealedCells.every(Boolean) ? (revealing ? 'Calculating...' : '') : 'Scratch all three panels to reveal'
          }}
        </p>
      </div>

      <div class="flex gap-4">
        <ScratchCell v-for="(symbol, i) in activeTicket.symbols" :key="`${activeTicket.id}-${i}`" :symbol="symbol"
          @revealed="onCellRevealed(i)" />
      </div>

      <!-- Result -->
      <Transition name="fade">
        <div v-if="result" class="w-full flex flex-col items-center gap-3 text-center">
          <template v-if="result.outcome === 'jackpot'">
            <p class="text-3xl">🎉</p>
            <p class="text-xl font-bold text-success">JACKPOT!</p>
            <p class="text-sm text-muted">You won <span class="font-semibold text-success">¤{{
              formatBalance(result.payout) }}</span></p>
          </template>
          <template v-else-if="result.outcome === 'win'">
            <p class="text-2xl">🎊</p>
            <p class="text-lg font-bold text-success">Winner!</p>
            <p class="text-sm text-muted">You won <span class="font-semibold text-success">¤{{
              formatBalance(result.payout) }}</span></p>
          </template>
          <template v-else>
            <p class="text-lg font-medium text-muted">No match this time.</p>
            <p class="text-xs text-muted">Better luck next time!</p>
          </template>

          <UButton v-if="remaining > 0" label="Buy another" color="primary" variant="soft" @click="closeResult" />
          <UButton v-else label="Done" color="neutral" variant="ghost" @click="closeResult" />
        </div>
      </Transition>
    </div>

    <!-- Ticket shop -->
    <div v-if="!activeTicket || result" class="flex flex-col gap-4">
      <!-- Free daily ticket -->
      <div class="rounded-xl border-2 border-success/40 bg-success/5 p-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <span class="text-3xl">🍀</span>
          <div>
            <div class="flex items-center gap-2">
              <p class="font-bold">Today's Lucky Dip</p>
              <UBadge label="FREE" color="success" variant="soft" size="xs" />
            </div>
            <div class="flex gap-3 mt-1.5 text-xs text-muted">
              <span>Win <span class="font-semibold text-foreground">¤{{ formatBalance(settings?.scratcherFreeWinPrize ?? 15) }}</span></span>
              <span>·</span>
              <span>Jackpot <span class="font-semibold text-foreground">¤{{ formatBalance(settings?.scratcherFreeJackpotPrize ?? 1500) }}</span></span>
            </div>
          </div>
        </div>
        <UButton
          :label="usedFreeToday ? 'Claimed' : 'Scratch'"
          :disabled="usedFreeToday || !loggedIn"
          :loading="buying === 'free'"
          color="success"
          :variant="usedFreeToday ? 'soft' : 'solid'"
          class="shrink-0"
          @click="claimFree"
        />
      </div>

      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Ticket Shop</h2>

      <UAlert v-if="buyError" color="error" variant="soft" :description="buyError" />
      <UAlert v-if="remaining === 0" color="neutral" variant="soft" icon="i-lucide-clock"
        description="You've used all your scratchers for today. Come back tomorrow!" />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="t in TIERS" :key="t.price" class="rounded-xl border border-(--ui-border) p-5 flex flex-col gap-4">
          <div class="flex items-start justify-between gap-2 flex-1">
            <div class="min-w-0">
              <p class="font-bold leading-tight">{{ t.name }}</p>
              <p class="text-xs text-muted mt-0.5 italic">{{ t.tagline }}</p>
            </div>
            <span class="text-2xl shrink-0">{{ t.emoji }}</span>
          </div>

          <div class="flex flex-col gap-1.5 text-xs text-muted">
            <div class="flex justify-between">
              <span>Match 3 — Win</span>
              <span class="font-semibold text-foreground">¤{{ formatBalance(winPrize(t.price)) }}</span>
            </div>
            <div class="flex justify-between">
              <span>💎 Jackpot</span>
              <span class="font-semibold text-foreground">¤{{ formatBalance(jackpotPrize(t.price)) }}</span>
            </div>
          </div>

          <UButton block :label="remaining === 0 ? 'Sold out today' : `Buy for ¤${t.price}`"
            :disabled="remaining === 0 || (loggedIn && (user?.balance ?? 0) < t.price)" :loading="buying === t.price"
            @click="buy(t.price)" />
          <p v-if="loggedIn && (user?.balance ?? 0) < t.price" class="text-xs text-error text-center -mt-2">
            Insufficient balance
          </p>
        </div>
      </div>

      <p class="text-xs text-muted text-center">
        Odds set by admins. Match all 3 symbols to win or find 💎 on the third panel for the jackpot.
      </p>
    </div>
  </UContainer>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
