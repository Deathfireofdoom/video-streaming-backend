import { Router } from "express";
import { getHealth } from "../controllers/health";


const healthRouter = Router();
healthRouter.get('/', getHealth);

export default healthRouter;
