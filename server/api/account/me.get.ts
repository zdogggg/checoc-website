import type { CustomerAccount, LoginChannels } from '#shared/types/customers'

// null when not signed in, so pages can render a sign-in form without an error
export default defineEventHandler(async (event): Promise<{ account: CustomerAccount | null; login: LoginChannels }> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const customer = await currentCustomer(event)
  const account = customer ? await loadAccount(customer.id) : null
  return { account, login: loginChannels() }
})
