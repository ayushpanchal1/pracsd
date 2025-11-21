import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { getUserId } from '../utils.mjs'

const dynamoDb = DynamoDBDocument.from(new DynamoDB())
const todosTable = process.env.TODOS_TABLE

const handler = middy(async (event) => {
  const todoId = event.pathParameters.todoId
  const updatedTodo = JSON.parse(event.body)
  const userId = getUserId(event)

  const updateExpressionParts = []
  const expressionAttributeValues = {}
  const expressionAttributeNames = {}

  if (updatedTodo.name !== undefined) {
    updateExpressionParts.push('#name = :name')
    expressionAttributeValues[':name'] = updatedTodo.name
    expressionAttributeNames['#name'] = 'name'
  }

  if (updatedTodo.dueDate !== undefined) {
    updateExpressionParts.push('dueDate = :dueDate')
    expressionAttributeValues[':dueDate'] = updatedTodo.dueDate
  }

  if (updatedTodo.done !== undefined) {
    updateExpressionParts.push('done = :done')
    expressionAttributeValues[':done'] = updatedTodo.done
  }

  if (updateExpressionParts.length === 0) {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No fields to update' })
    }
  }

  await dynamoDb.update({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    },
    UpdateExpression: 'set ' + updateExpressionParts.join(', '),
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  })

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
})

handler.use(cors({ credentials: true }))

export { handler }