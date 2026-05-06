const isOpen = ref(false)
const mode = ref<'signin' | 'signup'>('signin')

export function useAuthModal() {
  return {
    isOpen,
    mode: readonly(mode),
    open(m: 'signin' | 'signup' = 'signin') {
      mode.value = m
      isOpen.value = true
    },
    close() {
      isOpen.value = false
    },
    toggle() {
      mode.value = mode.value === 'signin' ? 'signup' : 'signin'
    }
  }
}
