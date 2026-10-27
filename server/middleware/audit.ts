// Records every write to the admin API once the response is sent (status included).
// Request bodies are not stored: they can contain passwords and customer details.

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler(async (event) => {
  if (!WRITE_METHODS.has(event.method) || !event.path.startsWith('/api/admin/')) return
  const { user } = await getUserSession(event)
  if (!user) return // requireStaff answers 401; nothing to attribute

  event.node.res.once('finish', () => {
    void writeAudit(event, { userId: user.id, userEmail: user.email, status: event.node.res.statusCode })
  })
})
