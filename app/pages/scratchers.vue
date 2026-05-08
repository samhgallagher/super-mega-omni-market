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

const TIERS = [10, 100, 500]

function winPrize(tier: number) {
  return Math.round(tier * (settings.value?.scratcherWinMultiplier ?? 3) * 100) / 100
}
function jackpotPrize(tier: number) {
  return Math.round(tier * (settings.value?.scratcherJackpotMultiplier ?? 100) * 100) / 100
}
function ev(tier: number) {
  const s = settings.value
  if (!s) return 0
  return Math.round((s.scratcherWinOdds * winPrize(tier) + s.scratcherJackpotOdds * jackpotPrize(tier)) / tier * 1000) / 10
}

// Active scratch state
const activeTicket = ref<{ id: string, tier: number, symbols: [string, string, string] } | null>(null)
const revealedCells = ref([false, false, false])
const result = ref<{ outcome: string, payout: number } | null>(null)
const buying = ref<number | null>(null)
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
          <span :class="remaining === 0 ? 'text-error font-semibold' : 'font-semibold text-foreground'">{{ remaining }}</span>
          / {{ dailyLimit }} remaining today
        </span>
      </div>
    </div>

    <!-- Unscratched tickets from previous sessions -->
    <div v-if="unscratched.length" class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Unscratched</h2>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="t in unscratched"
          :key="t.id"
          :label="`¤${t.tier} ticket`"
          icon="i-lucide-ticket"
          color="warning"
          variant="soft"
          size="sm"
          @click="openUnscratched(t)"
        />
      </div>
    </div>

    <!-- Active scratch card -->
    <div v-if="activeTicket" ref="scratchRef" class="rounded-xl border-2 border-(--ui-border) p-6 flex flex-col items-center gap-6 bg-(--ui-bg-elevated)">
      <div class="text-center">
        <p class="text-xs uppercase tracking-widest text-muted mb-1">¤{{ activeTicket.tier }} Scratcher</p>
        <p class="text-sm text-muted">
          {{ revealedCells.every(Boolean) ? (revealing ? 'Calculating...' : '') : 'Scratch all three panels to reveal' }}
        </p>
      </div>

      <div class="flex gap-4">
        <ScratchCell
          v-for="(symbol, i) in activeTicket.symbols"
          :key="`${activeTicket.id}-${i}`"
          :symbol="symbol"
          @revealed="onCellRevealed(i)"
        />
      </div>

      <!-- Result -->
      <Transition name="fade">
        <div v-if="result" class="w-full flex flex-col items-center gap-3 text-center">
          <template v-if="result.outcome === 'jackpot'">
            <p class="text-3xl">🎉</p>
            <p class="text-xl font-bold text-success">JACKPOT!</p>
            <p class="text-sm text-muted">You won <span class="font-semibold text-success">¤{{ formatBalance(result.payout) }}</span></p>
          </template>
          <template v-else-if="result.outcome === 'win'">
            <p class="text-2xl">🎊</p>
            <p class="text-lg font-bold text-success">Winner!</p>
            <p class="text-sm text-muted">You won <span class="font-semibold text-success">¤{{ formatBalance(result.payout) }}</span></p>
          </template>
          <template v-else>
            <p class="text-lg font-medium text-muted">No match this time.</p>
            <p class="text-xs text-muted">Better luck next time!</p>
          </template>

          <UButton
            v-if="remaining > 0"
            label="Buy another"
            color="primary"
            variant="soft"
            @click="closeResult"
          />
          <UButton
            v-else
            label="Done"
            color="neutral"
            variant="ghost"
            @click="closeResult"
          />
        </div>
      </Transition>
    </div>

    <!-- Ticket shop -->
    <div v-if="!activeTicket || result" class="flex flex-col gap-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Ticket Shop</h2>

      <UAlert v-if="buyError" color="error" variant="soft" :description="buyError" />
      <UAlert
        v-if="remaining === 0"
        color="neutral"
        variant="soft"
        icon="i-lucide-clock"
        description="You've used all your scratchers for today. Come back tomorrow!"
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="tier in TIERS"
          :key="tier"
          class="rounded-xl border border-(--ui-border) p-5 flex flex-col gap-4"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-2xl font-bold">¤{{ tier }}</p>
              <p class="text-xs text-muted mt-0.5">per ticket</p>
            </div>
            <span class="text-2xl">🎟️</span>
          </div>

          <div class="flex flex-col gap-1.5 text-xs text-muted">
            <div class="flex justify-between">
              <span>Match 3 — Win</span>
              <span class="font-semibold text-foreground">¤{{ formatBalance(winPrize(tier)) }}</span>
            </div>
            <div class="flex justify-between">
              <span>💎 Jackpot</span>
              <span class="font-semibold text-foreground">¤{{ formatBalance(jackpotPrize(tier)) }}</span>
            </div>
            <div class="border-t border-(--ui-border) pt-1.5 mt-0.5 flex flex-col gap-1">
              <div class="flex justify-between">
                <span>Win odds</span>
                <span>{{ ((settings?.scratcherWinOdds ?? 0) * 100).toFixed(1) }}%</span>
              </div>
              <div class="flex justify-between">
                <span>Jackpot odds</span>
                <span>{{ ((settings?.scratcherJackpotOdds ?? 0) * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>

          <UButton
            block
            :label="remaining === 0 ? 'Sold out today' : `Buy for ¤${tier}`"
            :disabled="remaining === 0 || (loggedIn && (user?.balance ?? 0) < tier)"
            :loading="buying === tier"
            @click="buy(tier)"
          />
          <p v-if="loggedIn && (user?.balance ?? 0) < tier" class="text-xs text-error text-center -mt-2">
            Insufficient balance
          </p>
        </div>
      </div>

      <p class="text-xs text-muted text-center">
        Odds are set by admins. Match all 3 symbols to win, or find 💎 on the third panel for the jackpot.
        The first two panels always match — the third is the reveal.
      </p>
    </div>
  </UContainer>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
