import { and, eq, ne } from 'drizzle-orm'
import type { OptionInput } from '#shared/schemas/catalog'

// Insert or update an option. In single-choice groups (sugar, ice) only one
// option may be the default, so marking one clears the flag on the others.
export async function saveOption(id: number | null, input: OptionInput) {
  const { options, optionGroups } = schema
  return useDb().transaction(async (tx) => {
    const group = await tx.query.optionGroups.findFirst({ where: eq(optionGroups.id, input.groupId) })
    if (!group) throw createError({ statusCode: 422, statusMessage: 'Unknown option group' })

    const [row] =
      id == null
        ? await tx.insert(options).values(input).returning()
        : await tx.update(options).set(input).where(eq(options.id, id)).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Option not found' })

    if (input.isDefault && !group.multiple) {
      await tx
        .update(options)
        .set({ isDefault: false })
        .where(and(eq(options.groupId, group.id), ne(options.id, row.id)))
    }
    return row
  })
}
