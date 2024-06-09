import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { PORT, S3_BUCKET_NAME } from './config/config';
import healthRouter from './routes/health';
import videoRouter from './routes/video';
import connectDB from './clients/mongoClient';
import { createQueue } from './services/sqsService';
import { createS3Bucket } from './services/s3Service';

const app = express();

app.use(express.json());

app.use(cors());
app.use(morgan('combined'))

app.use('/health', healthRouter);
app.use('/video', videoRouter);

const startServer = async () => {
  try {
    await connectDB();
    // Creating the queue and s3 bucket should ofcourse not be done at startup like this.
    // This is only added here to make it easier for others to demo the system.
    try {
      await createQueue();
    } catch (error) {
      console.log('failed to init the queue')
    }
    try {
      await createS3Bucket(S3_BUCKET_NAME);
    } catch (error) {
      console.log('failed to create the bucket, or it was already created')
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();