import connectDB from './clients/mongoClient';
import { receiveMessages, deleteMessage } from './services/sqsService';
import { processVideoMessage } from './services/videoProcessingService';
import { sleep } from './utils/sleep';

const startWorker = async () => {
  await connectDB();

  console.log('SQS Worker started');
  while (true) {
    try {
      const messages = await receiveMessages();
      for (const message of messages) {
        if (message.Body && message.ReceiptHandle) {
          await processVideoMessage(message.Body);
          await deleteMessage(message.ReceiptHandle);
        }
      }
    } catch (error) {
      console.error('Error in worker loop:', error);
      await sleep(5000); // so the log does not get spammed in case of error
    }
  }
};

startWorker();
