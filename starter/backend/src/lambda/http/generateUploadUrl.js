import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { getUserId } from '../utils.mjs'

const s3 = new S3Client()
const dynamoDb = DynamoDBDocument.from(new DynamoDB())

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const todosTable = process.env.TODOS_TABLE
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const handler = middy(async (event) => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: todoId
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: parseInt(urlExpiration) })

  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`

  await dynamoDb.update({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    },
    UpdateExpression: 'set attachmentUrl = :attachmentUrl',
    ExpressionAttributeValues: {
      ':attachmentUrl': attachmentUrl
    }
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl
    })
  }
})

handler.use(cors({ credentials: true }))

export { handler }