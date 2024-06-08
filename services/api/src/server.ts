import express from 'express';
import { PORT } from './config/config';
import healthRouter from './routes/health';

const app = express();

app.use(express.json());
app.use('/health', healthRouter);


app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})