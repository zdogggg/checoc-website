export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user) await writeAudit(event, { userId: session.user.id, userEmail: session.user.email, status: 200 })
  if (session.customer) {
    // A shopper is signed in in the same browser: drop only the staff part
    const { user: _user, loggedInAt: _loggedInAt, ...rest } = session
    await replaceUserSession(event, rest)
  } else {
    await clearUserSession(event)
  }
  return { ok: true }
})
