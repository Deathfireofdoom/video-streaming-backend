import { CreateBucketCommand, PutObjectCommand, GetObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../clients/s3Client";
import { v4 as uuidv4 } from 'uuid';
import { Readable } from "stream";
import { S3_BUCKET_NAME, AWS_ENDPOINT } from '../config/config';
import fs from 'fs';


// this is only for demo purposes
const uploadCorsConfig = async (bucketName: string) => {
  const corsConfig = JSON.parse(fs.readFileSync('cors.json', 'utf-8'));
  const params = {
    Bucket: bucketName,
    CORSConfiguration: corsConfig
  };

  const command = new PutBucketCorsCommand(params);
  await s3Client.send(command);
  console.log('CORS configuration uploaded successfully');
};

export const createS3Bucket = async (bucketName: string) => {
  const params = {
    Bucket: bucketName,
  };

  try {
    await s3Client.send(new CreateBucketCommand(params));
    await uploadCorsConfig(bucketName);
    return `Bucket "${bucketName}" created successfully.`;
  } catch (err) {
    console.error("Error creating bucket:", err);
    throw new Error("Error creating bucket");
  }
};



interface UploadResult {
  s3Key: string;
  s3Url: string;
}

export const uploadFileToS3 = async (file: Express.Multer.File | Readable, key?: string): Promise<UploadResult> => {
  const s3Key = key ? key : `${uuidv4()}`;
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: file instanceof Readable ? file : file.buffer,
    ContentType: file instanceof Readable ? 'application/octet-stream' : file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  
  return {
    s3Key: s3Key,
    s3Url: `${AWS_ENDPOINT}/${S3_BUCKET_NAME}/${s3Key}`
  };
};

export const loadFileFromS3 = async (s3Key: string): Promise<Buffer> => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
  };

  const command = new GetObjectCommand(params);
  const data = await s3Client.send(command);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const stream = data.Body as Readable;

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
};