export function isAdminEmail(email: string): boolean {
  const admins = (useRuntimeConfig().adminEmails ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}
