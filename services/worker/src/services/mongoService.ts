import Video from "../models/video";

export const getVideoById = async (id: string) => {
    try {
        const video = await Video.findById(id);
        if (!video) {
            throw new Error('Video not found');
        }
        return video;
    } catch (error) {
        console.error('Error getting video by ID:', error);
        throw error;
    }
};

export const updateVideoById = async (id: string, status: string, masterPlaylistUrl: string) => {
    try {
        const video = await Video.findByIdAndUpdate(
            id,
            { encodingStatus: status, masterPlaylistUrl },
            { new: true }
        );
        if (!video) {
            throw new Error('Video not found');
        }
        return video;
    } catch (error) {
        console.error('Error updating video by ID:', error);
        throw error;
    }
};
