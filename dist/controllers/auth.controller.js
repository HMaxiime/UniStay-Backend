import { registerUser, loginUser } from '../utils/auth.service.js';
const ALLOWED_ROLES = ['STUDENT', 'HOST', 'EMPLOYER'];
export const register = async (req, res) => {
    try {
        const { fullName, email, password, phone, location, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ message: 'fullName, email, password and role are required' });
        }
        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Role must be STUDENT, HOST, or EMPLOYER' });
        }
        const user = await registerUser({ fullName, email, password, phone, location, role });
        return res.status(201).json({ message: 'User registered successfully', user });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = await loginUser({ email, password });
        return res.status(200).json({ message: 'Login successful', ...result });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const getMe = async (req, res) => {
    return res.status(200).json({ user: req.user });
};
//# sourceMappingURL=auth.controller.js.map