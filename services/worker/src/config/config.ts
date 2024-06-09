import dotenv from 'dotenv';
dotenv.config()

export const PORT = process.env.PORT || 3000;
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'videos';
export const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
export const AWS_ENDPOINT = process.env.AWS_ENDPOINT || 'http://localhost:4566'
export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '000000000000' 
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test'
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test'
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-streaming'


export const SQS_QUEUE_NAME = process.env.SQS_QUEUE_NAME || 'video-encoding-queue'
export const SQS_QUEUE_URL = `${AWS_ENDPOINT}/${AWS_ACCOUNT_ID}/${SQS_QUEUE_NAME}`