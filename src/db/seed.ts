import dayjs from 'dayjs'
import { client, db } from '.'
import { goalCompletionsTable, goalsTable } from './schema'

async function seed() {
  await db.delete(goalCompletionsTable)
  await db.delete(goalsTable)

  const results = await db
    .insert(goalsTable)
    .values([
      { title: 'Acordar cedo', desiredWeeklyFrequency: 5 },
      { title: 'Me exercitar', desiredWeeklyFrequency: 3 },
      { title: 'Meditar', desiredWeeklyFrequency: 2 },
    ])
    .returning()

  const startOfWeek = dayjs().startOf('week')

  await db.insert(goalCompletionsTable).values([
    { goalId: results[0].id, createdAt: startOfWeek.toDate() },
    { goalId: results[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
  ])
}

seed().then(() => {
  client.end()
})
