// Money figures are owner/manager only, like the P&L page
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const { from, to } = await readReportRange(event)
  return salesReport(from, to)
})
