import { Router } from "express";
import multer from 'multer';
import { uploadVideo, listAllVideos, getVideoById } from "../controllers/video";


const videoRouter = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


videoRouter.post('/upload', upload.single('video'), uploadVideo);
videoRouter.get('/', listAllVideos);
videoRouter.get('/:id', getVideoById);

export default videoRouter;
