import { Request, Response } from 'express';
import { uploadFileToS3 } from '../services/s3Service';
import { saveNewVideo, getAllVideos, getVideoByIdFromDB } from '../services/mongoService';
import { publishMessage } from '../services/sqsService';

export const uploadVideo = async(req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('Cant upload a file without a file');
    }

    try {
        console.log('uploading file to s3')
        const response = await uploadFileToS3(file);
        
        console.log('saving metadata to mongo')
        console.log(response.s3Key)
        const newVideoId = await saveNewVideo(file.originalname, response.s3Key)
        
        console.log('queuing video for enconding')
        const messageBody = JSON.stringify({ id: newVideoId });
        await publishMessage(messageBody);

        res.status(200).json({status: 'uploaded'})
    } catch (error){
        if(error instanceof Error) {
            // here we decide to not return the full error message to the user since this
            // could potentially expose the inner workings of our system. Hackers will hack.
            console.log(`error when uploading video: ${error.message}`)
            res.status(500).json({ error: 'failed to upload the video'})
        } else {
            res.status(500).json({ error: 'uknown error'})
        }
    }
}


export const listAllVideos = async (req: Request, res: Response) => {
    const { status } = req.query;
    try {
        const videos = await getAllVideos(status as string);
        res.status(200).json(videos);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}

export const getVideoById = async(req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const video = await getVideoByIdFromDB(id);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.status(200).json(video);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}