import { Request, Response } from "express";

export const getHealth = (_: Request, res: Response): void => {
    res.status(200).json({ status: 'everything is good in the hood', timestamp: new Date() })
}