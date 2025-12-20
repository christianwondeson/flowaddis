"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, sendVerificationEmail } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(name, email, password);
            await sendVerificationEmail();
            toast.success('Account created! Please check your email to verify your account.');
            router.push('/');
        } catch (error: any) {
            console.error(error);
            toast.error(`Registration failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-gray p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo className="text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-brand-dark">Create Account</h1>
                    <p className="text-gray-500">Join Flowaddis today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-brand-primary font-bold hover:underline">
                        Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
