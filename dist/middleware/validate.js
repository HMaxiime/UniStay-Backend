import { errorResponse } from '../templates/response.templates.js';
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json(errorResponse('Validation failed', result.error.flatten()));
        return;
    }
    req.body = result.data;
    next();
};
//# sourceMappingURL=validate.js.map