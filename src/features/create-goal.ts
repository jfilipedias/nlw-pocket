import { db } from '../db'
import { goalsTable } from '../db/schema'

interface CreateGoalParams {
  title: string
  desiredWeeklyFrequency: number
}

export async function createGoal({
  title,
  desiredWeeklyFrequency,
}: CreateGoalParams) {
  const results = await db
    .insert(goalsTable)
    .values({ title, desiredWeeklyFrequency })
    .returning()
  const goal = results[0]
  return { goal }
}
