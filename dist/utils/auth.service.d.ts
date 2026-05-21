import { Role } from '@prisma/client';
export declare const registerUser: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string | null;
    location?: string | null;
    role: Role;
}) => Promise<{
    id: string;
    email: string;
    role: import("@prisma/client").$Enums.Role;
}>;
export declare const loginUser: (data: {
    email: string;
    password: string;
}) => Promise<{
    token: string;
    user: {
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map