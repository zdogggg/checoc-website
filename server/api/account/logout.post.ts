export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user) {
    // A staff member is signed in too: drop only the customer part
    const { customer: _customer, ...rest } = session
    await replaceUserSession(event, rest)
  } else {
    await clearUserSession(event)
  }
  return { ok: true }
})
