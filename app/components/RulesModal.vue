<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal v-model:open="open" :ui="{ width: 'max-w-lg' }">
    <template #content>
      <div class="p-6 flex flex-col gap-5">
        <h2 class="text-lg font-bold">House Rules</h2>

        <ol class="flex flex-col gap-4 text-sm">
          <li>
            <p class="font-semibold">1. Insider trading is not just tolerated — it is encouraged.</p>
            <p class="text-muted mt-1">If you have material non-public information, use it. We are not a financial regulator and have no plans to become one.</p>
          </li>
          <li>
            <p class="font-semibold">2. Keep community markets in good spirit.</p>
            <p class="text-muted mt-1">Markets about specific people are fine, provided you are confident they will take it well. If you are not confident, they probably won't. Complaints about the site may ruin it for everyone.</p>
          </li>
          <li>
            <p class="font-semibold">3. One account per person.</p>
            <p class="text-muted mt-1">This is to prevent players from creating infinite money and funnelling it to themselves. Admins reserve the right to ban duplicate accounts.</p>
          </li>
          <li>
            <p class="font-semibold">4. If you have lost your password, Sam can reset it for you.</p>
          </li>
          <li>
            <p class="font-semibold">5. Admin decisions are final.</p>
            <p class="text-muted mt-1">There is no appeals process.</p>
          </li>
          <li>
            <p class="font-semibold">6. The currency is not real.</p>
            <p class="text-muted mt-1">You cannot withdraw it, spend it, or use it for anything outside this site. On this site, it buys scratch tickets. That is the full extent of its purchasing power.</p>
          </li>
          <li>
            <p class="font-semibold">7. The scratchers exist for a reason.</p>
            <p class="text-muted mt-1">If you have lost everything, they are the intended path back. The odds favour the player. Marginally.</p>
          </li>
        </ol>

        <div class="flex justify-end">
          <UButton label="Got it" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
