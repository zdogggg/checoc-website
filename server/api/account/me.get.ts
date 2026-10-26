import type { CustomerAccount } from '#shared/types/customers'

// null when not signed in, so pages can render a sign-in form without an error
export default defineEventHandler(async (event): Promise<{ account: CustomerAccount | null; smsReady: boolean }> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const session = await getUserSession(event)
  const account = session.customer ? await loadAccount(session.customer.id) : null
  return { account, smsReady: canSendLoginCodes() }
})
