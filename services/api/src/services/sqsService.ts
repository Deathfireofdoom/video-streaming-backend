import { SendMessageCommand, CreateQueueCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../clients/sqsClient";
import { SQS_QUEUE_URL, SQS_QUEUE_NAME } from "../config/config";

export const publishMessage = async (messageBody: string) => {
  const params = {
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: messageBody,
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    console.log("Message sent successfully:", data.MessageId);
    return data;
  } catch (err) {
    console.error("Error sending message:", err);
    throw new Error("Error sending message to SQS");
  }
};

export const createQueue = async () => {
  const params = {
    QueueName: SQS_QUEUE_NAME,
  };

  try {
    const data = await sqsClient.send(new CreateQueueCommand(params));
    console.log("Queue created successfully:", data.QueueUrl);
    return data.QueueUrl;
  } catch (err) {
    console.error("Error creating queue:", err);
    throw new Error("Error creating SQS queue");
  }
};
