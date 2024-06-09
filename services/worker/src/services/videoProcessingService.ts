import { getVideoById, updateVideoById } from './mongoService';
import { encodeVideo } from './encoderService';

export const processVideoMessage = async (messageBody: string) => {
  const { id } = JSON.parse(messageBody);
  try {
    const video = await getVideoById(id);
    if (video) {
      console.log(`Processing video with ID: ${id}`);
      const masterPlaylistUrl = await encodeVideo(video.originalS3Key);
      await updateVideoById(id, 'completed',  masterPlaylistUrl);
    } else {
      console.log(`Video with ID ${id} not found`);
    }
  } catch (error) {
    console.error(`Error processing video with ID ${id}:`, error);
    await updateVideoById(id, 'error', '');
  }
};
