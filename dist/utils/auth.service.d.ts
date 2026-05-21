import { Role } from '@prisma/client';
export declare const registerUser: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string | null;
    location?: string | null;
    role: Role;
}) => Promise<{
    id: any;
    email: any;
    role: any;
}>;
export declare const loginUser: (data: {
    email: string;
    password: string;
}) => Promise<{
    token: string;
    user: {
        id: any;
        email: any;
        role: any;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map