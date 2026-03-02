import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: result.error.flatten().fieldErrors,
            });
        }
        req.body = result.data; // Use sanitized data
        next();
    };
};
