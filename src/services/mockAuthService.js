import { users } from '../mockData/users';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const mockAuthService = {
    async login(email, password, role) {
        await delay(800);
        const user = users.find(
            (u) => u.email === email && u.password === password && u.role === role
        );
        if (!user) {
            throw new Error('Invalid credentials or role mismatch');
        }
        return { ...user, password: undefined };
    },
    async register(userData) {
        await delay(1000);
        const exists = users.find((u) => u.email === userData.email);
        if (exists) {
            throw new Error('Email already registered');
        }
        const newUser = {
            id: `user-${Date.now()}`,
            ...userData,
            avatar: null,
        };
        users.push(newUser);
        return { ...newUser, password: undefined };
    },
};
