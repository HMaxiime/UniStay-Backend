export const successResponse = (message, data) => ({
    success: true,
    message,
    ...(data !== undefined && { data }),
});
export const errorResponse = (message, errors) => ({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
});
//# sourceMappingURL=response.templates.js.map