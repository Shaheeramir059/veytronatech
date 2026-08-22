const { randomUUID } = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { awsCredentialsProvider } = require('@vercel/oidc-aws-credentials-provider');

let client;

function config() {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const partitionKey = process.env.DYNAMODB_TABLE_PARTITION_KEY;
  const sortKey = process.env.DYNAMODB_TABLE_SORT_KEY;
  if (!tableName || !partitionKey || !sortKey || !process.env.AWS_REGION || !process.env.AWS_ROLE_ARN) throw new Error('DynamoDB is not configured.');
  return { tableName, partitionKey, sortKey };
}

function getDb() {
  if (!client) {
    const region = process.env.AWS_REGION;
    client = DynamoDBDocumentClient.from(new DynamoDBClient({
      region,
      credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN, clientConfig: { region } })
    }), { marshallOptions: { removeUndefinedValues: true } });
  }
  return client;
}

function leadKey(id) {
  const { partitionKey, sortKey } = config();
  return { [partitionKey]: 'LEAD', [sortKey]: id };
}

async function createLead(values) {
  const { tableName, partitionKey, sortKey } = config();
  const createdAt = new Date().toISOString();
  const id = `${createdAt}#${randomUUID()}`;
  await getDb().send(new PutCommand({
    TableName: tableName,
    Item: { ...leadKey(id), id, ...values, status: 'unread', created_at: createdAt },
    ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
    ExpressionAttributeNames: { '#pk': partitionKey, '#sk': sortKey }
  }));
  return id;
}

async function listLeads() {
  const { tableName, partitionKey } = config();
  const messages = [];
  let ExclusiveStartKey;
  do {
    const result = await getDb().send(new QueryCommand({ TableName: tableName, KeyConditionExpression: '#pk = :lead', ExpressionAttributeNames: { '#pk': partitionKey }, ExpressionAttributeValues: { ':lead': 'LEAD' }, ScanIndexForward: false, ExclusiveStartKey }));
    messages.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return messages;
}

async function updateLeadStatus(id, status) {
  const { tableName, partitionKey } = config();
  await getDb().send(new UpdateCommand({ TableName: tableName, Key: leadKey(id), UpdateExpression: 'SET #status = :status', ConditionExpression: 'attribute_exists(#pk)', ExpressionAttributeNames: { '#status': 'status', '#pk': partitionKey }, ExpressionAttributeValues: { ':status': status } }));
}

async function deleteLead(id) {
  const { tableName, partitionKey } = config();
  await getDb().send(new DeleteCommand({ TableName: tableName, Key: leadKey(id), ConditionExpression: 'attribute_exists(#pk)', ExpressionAttributeNames: { '#pk': partitionKey } }));
}

module.exports = { createLead, deleteLead, listLeads, updateLeadStatus };
