// Largest value a PostgreSQL integer column holds. Every whole number a form sends (ids, prices,
// amounts, limits) is capped at it, so an absurd value is a validation error (422) instead of a
// failed query (500).
export const DB_INT_MAX = 2_147_483_647
