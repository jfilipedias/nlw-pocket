import fastify from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import z from 'zod'
import { createGoal } from '../features/create-goal'
import { createGoalCompletion } from '../features/create-goal-completion'
import { getWeekPendingGoals } from '../features/get-week-pending-goals'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7),
      }),
    },
  },
  async request => {
    const { title, desiredWeeklyFrequency } = request.body
    await createGoal({ title, desiredWeeklyFrequency })
  }
)

app.post(
  '/completions',
  {
    schema: {
      body: z.object({
        goalId: z.string(),
      }),
    },
  },
  async request => {
    const { goalId } = request.body
    await createGoalCompletion({ goalId })
  }
)

app.get('/pending-goals', async () => {
  const { pendingGoals } = await getWeekPendingGoals()
  return { pendingGoals }
})

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server runing!')
})
