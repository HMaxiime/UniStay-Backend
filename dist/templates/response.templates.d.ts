export declare const successResponse: <T>(message: string, data?: T) => {
    data?: T & ({} | null);
    success: boolean;
    message: string;
};
export declare const errorResponse: (message: string, errors?: unknown) => {
    errors?: {} | null;
    success: boolean;
    message: string;
};
//# sourceMappingURL=response.templates.d.ts.map