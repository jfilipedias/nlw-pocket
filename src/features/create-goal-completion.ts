import dayjs from 'dayjs'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletionsTable, goalsTable } from '../db/schema'

interface CreateGoalCompletionParams {
  goalId: string
}

export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionParams) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletionsTable.goalId,
        completionCount: count(goalCompletionsTable.id).as('completionCount'),
      })
      .from(goalCompletionsTable)
      .where(
        and(
          gte(goalCompletionsTable.createdAt, firstDayOfWeek),
          lte(goalCompletionsTable.createdAt, lastDayOfWeek),
          eq(goalsTable.id, goalId)
        )
      )
      .groupBy(goalCompletionsTable.goalId)
  )

  const result = await db
    .with(goalCompletionCounts)
    .select({
      desiredWeeklyFrequency: goalsTable.desiredWeeklyFrequency,
      completionCount: sql`
          COALESCE(${goalCompletionCounts.completionCount}, 0)
        `.mapWith(Number),
    })
    .from(goalsTable)
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, goalsTable.id)
    )
    .where(eq(goalsTable.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]
  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already completed this week!')
  }

  const insertResult = await db
    .insert(goalCompletionsTable)
    .values({ goalId })
    .returning()
  const goalCompletion = insertResult[0]
  return { goalCompletion }
}
