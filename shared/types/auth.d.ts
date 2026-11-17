// Session shape for nuxt-auth-utils. `user` is a staff member (admin area);
// `customer` is a shopper signed in by SMS code. Both can live in the same session.
declare module '#auth-utils' {
  interface UserSession {
    // A shopper signed in by a code (email or SMS); since = when (ms), checked against
    // customers.sessions_valid_after so "sign out everywhere" works
    customer?: { id: number; phone: string; since?: number }
    // When the staff member signed in (ms); sessions older than a password change are refused
    loggedInAt?: number
  }

  interface User {
    id: number
    email: string
    name: string
    role: 'owner' | 'manager' | 'staff'
  }
}

export {}
