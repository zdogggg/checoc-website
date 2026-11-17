// Keeps a staff session in the same browser
export default defineEventHandler(async (event) => {
  await endCustomerSession(event)
  return { ok: true }
})
