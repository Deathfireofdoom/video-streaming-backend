import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "../clients/sqsClient";
import { SQS_QUEUE_URL } from "../config/config";

export const receiveMessages = async () => {
  const params = {
    QueueUrl: SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    return data.Messages || [];
  } catch (err) {
    console.error("Error receiving messages:", err);
    throw new Error("Error receiving messages from SQS");
  }
};

export const deleteMessage = async (receiptHandle: string) => {
  const params = {
    QueueUrl: SQS_QUEUE_URL,
    ReceiptHandle: receiptHandle,
  };

  try {
    await sqsClient.send(new DeleteMessageCommand(params));
    console.log("Message deleted successfully");
  } catch (err) {
    console.error("Error deleting message:", err);
    throw new Error("Error deleting message from SQS");
  }
};
