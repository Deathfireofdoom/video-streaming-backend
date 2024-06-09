import Video from "../models/video";

export const saveNewVideo = async(filename: string, s3Key: string) => {
    const newVideo = new Video({
        originalFilename: filename,
        originalS3Key: s3Key,
        encodingStatus: 'pending',
        masterPlaylistUrl: 'placeholder'
    })

    await newVideo.save();
    return newVideo._id;
}

export const getAllVideos = async (status?: string) => {
    try {
        const query = status ? { encodingStatus: status } : {};
        return await Video.find(query);
    } catch (error) {
        console.error('Error getting videos:', error);
        throw error;
    }
};

export const getVideoByIdFromDB = async (id: string) => {
    try {
        return await Video.findById(id);
    } catch (error) {
        console.error('Error getting video by ID:', error);
        throw error;
    }
};