import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/db.config.js';
import { config } from '../config/app.config.js';
const JWT_SECRET = config.jwtSecret;
export const registerUser = async (data) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new Error('Email already in use');
    const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);
    const user = await prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            password: hashedPassword,
            phone: data.phone ?? null,
            location: data.location ?? null,
            role: data.role,
        },
    });
    return { id: user.id, email: user.email, role: user.role };
};
export const loginUser = async (data) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user)
        throw new Error('Invalid email or password');
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch)
        throw new Error('Invalid email or password');
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email, role: user.role } };
};
//# sourceMappingURL=auth.service.js.map