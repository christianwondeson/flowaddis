"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, User as UserIcon, MoreHorizontal, Mail, CreditCard, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/components/providers/auth-provider';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending';
    provider: string;
    transaction_id: string;
    created_at: string;
    booking: {
        id: string;
        booking_type: string;
    }
}

export default function UsersPage() {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Transaction History State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (!db) return;
                const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const fetchedUsers: User[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
                });
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const fetchUserTransactions = async (uid: string) => {
        setLoadingTransactions(true);
        try {
            const token = await auth?.currentUser?.getIdToken();
            const response = await fetch(`/api/admin/payments/user/${uid}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserTransactions(data || []);
            }
        } catch (error) {
            console.error("Error fetching user transactions:", error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleViewTransactions = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        fetchUserTransactions(user.id);
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'succeeded':
                return <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Success</span>;
            case 'failed':
                return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1"><XCircle className="w-2.5 h-2.5" /> Failed</span>;
            default:
                return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Pending</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading users...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{user.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                            {user.role === 'admin' ? 'Administrator' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.adminStatus === 'pending'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {user.adminStatus === 'pending' ? 'Pending Approval' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewTransactions(user)}>
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    View Transactions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transactions Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Transaction History - ${selectedUser?.name || selectedUser?.email}`}
            >
                <div className="space-y-6 p-1">
                    {loadingTransactions ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 font-medium">Fetching payment history...</p>
                        </div>
                    ) : userTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {userTransactions.map((tx) => (
                                <div key={tx.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-brand-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-0.5">#{tx.transaction_id.substring(0, 12)}...</div>
                                            <div className="text-sm font-bold text-gray-900">{tx.booking.booking_type.toUpperCase()} Booking</div>
                                            <div className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-brand-dark mb-1">{tx.currency} {Number(tx.amount).toLocaleString()}</div>
                                        {getStatusBadge(tx.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No transactions found for this user.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
