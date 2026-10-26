// Session shape for nuxt-auth-utils. `user` is a staff member (admin area);
// `customer` is a shopper signed in by SMS code. Both can live in the same session.
declare module '#auth-utils' {
  interface UserSession {
    customer?: { id: number; phone: string }
  }

  interface User {
    id: number
    email: string
    name: string
    role: 'owner' | 'manager' | 'staff'
  }
}

export {}
