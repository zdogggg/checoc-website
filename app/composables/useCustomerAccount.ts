import type { CustomerAccount } from '#shared/types/customers'

// The signed-in shopper (null when signed out). Shared key: checkout and the account page reuse it.
export function useCustomerAccount() {
  return useFetch<{ account: CustomerAccount | null; smsReady: boolean }>('/api/account/me', {
    key: 'account:me',
    default: () => ({ account: null, smsReady: false }),
  })
}
