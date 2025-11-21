import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { getUserId } from '../utils.mjs'

const dynamoDb = DynamoDBDocument.from(new DynamoDB())
const todosTable = process.env.TODOS_TABLE

const handler = middy(async (event) => {
  const newTodo = JSON.parse(event.body)
  const userId = getUserId(event)
  const todoId = uuidv4()
  const createdAt = new Date().toISOString()

  const newItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachmentUrl: null,
    ...newTodo
  }

  await dynamoDb.put({
    TableName: todosTable,
    Item: newItem
  })

  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newItem
    })
  }
})

handler.use(cors({ credentials: true }))

export { handler }