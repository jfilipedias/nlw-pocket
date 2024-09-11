import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletionsTable, goalsTable } from '../db/schema'

dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goalsTable.id,
        title: goalsTable.title,
        desiredWeeklyFrequency: goalsTable.desiredWeeklyFrequency,
        createdAt: goalsTable.createdAt,
      })
      .from(goalsTable)
      .where(lte(goalsTable.createdAt, lastDayOfWeek))
  )

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
          lte(goalCompletionsTable.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletionsTable.goalId)
  )

  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      completionCount: sql`
          COALESCE(${goalCompletionCounts.completionCount}, 0)
        `.mapWith(Number),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id)
    )

  return { pendingGoals }
}
