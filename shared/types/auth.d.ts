// Session shape for nuxt-auth-utils
declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
    role: 'owner' | 'manager' | 'staff'
  }
}

export {}
