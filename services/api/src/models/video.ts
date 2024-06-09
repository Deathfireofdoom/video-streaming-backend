import mongoose, { Document, Schema } from 'mongoose';

interface IVideo extends Document { 
  originalFilename: string;
  originalS3Key: string;
  encodingStatus: string;
  masterPlaylistUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  originalFilename: { type: String, required: true },
  originalS3Key: { type: String, required: true },
  encodingStatus: { type: String, default: 'pending' },
  masterPlaylistUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Video = mongoose.model<IVideo>('Video', VideoSchema);
export default Video;
