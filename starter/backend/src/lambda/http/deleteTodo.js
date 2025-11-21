import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { getUserId } from '../utils.mjs'

const dynamoDb = DynamoDBDocument.from(new DynamoDB())
const todosTable = process.env.TODOS_TABLE

const handler = middy(async (event) => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  await dynamoDb.delete({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    }
  })

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
})

handler.use(cors({ credentials: true }))

export { handler }