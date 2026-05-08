declare module '#auth-utils' {
  interface User {
    userId: string
    email: string
    username: string
    photo: string | null
    balance: number
    isAdmin: boolean
    mustChangePassword?: boolean
  }
}
export {}
