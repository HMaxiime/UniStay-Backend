import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { errorResponse } from '../templates/response.templates.js'

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json(errorResponse('Validation failed', result.error.flatten()))
    return
  }
  req.body = result.data
  next()
}
