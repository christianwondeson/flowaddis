export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    name?: string;
    createdAt?: any;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<UserRole>;
    register: (name: string, email: string, password?: string, adminCode?: string) => Promise<void>;
    sendMagicLink: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<UserRole>;
    sendVerificationEmail: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    requireAuth: () => void;
}
