<script setup lang="ts">
const { isOpen, mode, close, toggle } = useAuthModal()
const { fetch: refreshSession } = useUserSession()

const state = reactive({ email: '', username: '', photo: '', password: '', confirmPassword: '' })
const error = ref('')
const loading = ref(false)

function resetState() {
  state.email = ''
  state.username = ''
  state.photo = ''
  state.password = ''
  state.confirmPassword = ''
  error.value = ''
}

watch(isOpen, (val) => { if (!val) resetState() })
watch(mode, () => { error.value = '' })

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await $fetch('/api/auth/signin', { method: 'POST', body: { email: state.email, password: state.password } })
    }
    else {
      await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email: state.email,
          username: state.username,
          password: state.password,
          photo: state.photo || undefined
        }
      })
    }
    await refreshSession()
    close()
  }
  catch (e: any) {
    error.value = e.data?.message ?? 'Something went wrong. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 flex flex-col gap-5">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold">
              {{ mode === 'signin' ? 'Sign in to SMOM' : 'Create an account' }}
            </h2>
            <p class="text-sm text-muted">
              {{ mode === 'signin' ? 'Welcome back.' : 'Start trading with ¤10,000.' }}
            </p>
          </div>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="close()" />
        </div>

        <UAlert v-if="error" color="error" variant="soft" :description="error" />

        <UForm :state="state" class="flex flex-col gap-3" @submit="onSubmit">
          <UFormField label="Email" name="email" class="flex flex-col">
            <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
          </UFormField>
          <UFormField v-if="mode === 'signup'" label="Username" name="username" class="flex flex-col">
            <UInput v-model="state.username" placeholder="your_username" class="w-full" />
          </UFormField>
          <UFormField label="Password" name="password" class="flex flex-col">
            <UInput v-model="state.password" type="password" placeholder="••••••••" class="w-full" />
          </UFormField>
          <UFormField v-if="mode === 'signup'" label="Confirm password" name="confirmPassword" class="flex flex-col">
            <UInput v-model="state.confirmPassword" type="password" placeholder="••••••••" class="w-full" />
          </UFormField>
          <UFormField v-if="mode === 'signup'" label="Photo URL" name="photo" hint="Optional" class="flex flex-col">
            <UInput v-model="state.photo" placeholder="https://..." class="w-full" />
          </UFormField>
          <UButton type="submit" block :loading="loading" class="mt-1">
            {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
          </UButton>
        </UForm>

        <p class="text-sm text-muted text-center">
          <template v-if="mode === 'signin'">
            Don't have an account?
            <UButton variant="link" size="sm" label="Sign up" @click="toggle()" />
          </template>
          <template v-else>
            Already have an account?
            <UButton variant="link" size="sm" label="Sign in" @click="toggle()" />
          </template>
        </p>
      </div>
    </template>
  </UModal>
</template>
