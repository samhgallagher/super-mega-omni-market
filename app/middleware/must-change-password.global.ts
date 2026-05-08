export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  if (loggedIn.value && user.value?.mustChangePassword && to.path !== '/change-password') {
    return navigateTo('/change-password')
  }
})
