<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Create Market — Admin' })

const { data: categories } = await useFetch('/api/categories')

const state = reactive({
  title: '',
  description: '',
  category: '',
  photo: '',
  expiresAt: '',
  liquidity: 100
})

const outcomes = ref(['', ''])
const loading = ref(false)
const error = ref('')

function addOutcome() { outcomes.value.push('') }
function removeOutcome(i: number) { outcomes.value.splice(i, 1) }

const validOutcomes = computed(() => outcomes.value.filter(o => o.trim()))
const canSubmit = computed(() =>
  state.title.trim() && state.category && state.liquidity > 0 && validOutcomes.value.length >= 2
)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { id } = await $fetch('/api/admin/markets', {
      method: 'POST',
      body: {
        title: state.title,
        description: state.description || undefined,
        category: state.category,
        photo: state.photo || undefined,
        expiresAt: state.expiresAt ? new Date(state.expiresAt).getTime() : undefined,
        liquidity: state.liquidity,
        outcomes: validOutcomes.value
      }
    })
    await navigateTo(`/markets/${id}`)
  }
  catch (e: any) { error.value = e.data?.message ?? 'Something went wrong.' }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-8 flex flex-col gap-6 max-w-lg">
    <div class="flex items-center gap-3">
      <UButton to="/admin" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Create Market</h1>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :description="error" />

    <UForm :state="state" class="flex flex-col gap-4" @submit="submit">
      <UFormField label="Title" name="title">
        <UInput v-model="state.title" placeholder="Will X happen by Y?" class="w-full" />
      </UFormField>

      <UFormField label="Description" name="description" hint="Optional">
        <UTextarea v-model="state.description" placeholder="Provide context for this market..." :rows="3" class="w-full" />
      </UFormField>

      <UFormField label="Category" name="category">
        <USelect
          v-model="state.category"
          :items="(categories ?? []).map(c => ({ label: c.label, value: c.slug }))"
          placeholder="Select a category"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Photo URL" name="photo" hint="Optional">
        <UInput v-model="state.photo" placeholder="https://..." class="w-full" />
      </UFormField>

      <UFormField label="Expiry" name="expiresAt" hint="Optional">
        <UInput v-model="state.expiresAt" type="datetime-local" class="w-full" />
      </UFormField>

      <UFormField label="Liquidity" name="liquidity" hint="Higher = less price movement per trade">
        <UInput v-model.number="state.liquidity" type="number" :min="1" class="w-full" />
      </UFormField>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Outcomes</label>
        <div v-for="(_, i) in outcomes" :key="i" class="flex gap-2">
          <UInput v-model="outcomes[i]" :placeholder="`Outcome ${i + 1}`" class="flex-1" />
          <UButton
            v-if="outcomes.length > 2"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="removeOutcome(i)"
          />
        </div>
        <UButton
          label="Add outcome"
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          class="self-start"
          @click="addOutcome"
        />
      </div>

      <UButton type="submit" block :loading="loading" :disabled="!canSubmit">
        Create Market
      </UButton>
    </UForm>
  </UContainer>
</template>
