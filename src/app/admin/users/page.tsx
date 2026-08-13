'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from '@/types/auth';
import { parseUserRole } from '@/lib/auth/admin-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Shield,
    User as UserIcon,
    MoreHorizontal,
    Mail,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Hotel,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { AssignHotelAdminModal } from '@/components/admin/assign-hotel-admin-modal';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { AdminLoader } from '@/components/ui/admin-loader';
import { withRequestLoading } from '@/lib/request-loading';

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
    };
}

function roleLabel(role: User['role']): string {
    switch (role) {
        case 'admin':
            return 'Super Admin';
        case 'hotel_admin':
            return 'Hotel Admin';
        case 'hotel_staff':
            return 'Hotel Staff';
        default:
            return 'User';
    }
}

function statusLabel(user: User): { text: string; className: string } {
    if (user.hotelPartnerStatus === 'pending') {
        return {
            text: 'Hotel partner pending',
            className: 'bg-sky-100 text-sky-800',
        };
    }
    if (user.adminStatus === 'pending') {
        return {
            text: 'Admin pending',
            className: 'bg-orange-100 text-orange-800',
        };
    }
    return {
        text: 'Active',
        className: 'bg-green-100 text-green-800',
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            await withRequestLoading(async () => {
                if (!db) return;
                const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedUsers: User[] = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    fetchedUsers.push({
                        id: docSnap.id,
                        ...data,
                        role: parseUserRole(data.role),
                        email: String(data.email || ''),
                        emailVerified: Boolean(data.emailVerified),
                    } as User);
                });
                setUsers(fetchedUsers);
                setPage(1);
            }, 'Loading users…');
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchUsers();
    }, []);

    const fetchUserTransactions = async (uid: string) => {
        setLoadingTransactions(true);
        try {
            const token = await auth?.currentUser?.getIdToken();
            const response = await fetch(`/api/admin/payments/user/${uid}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUserTransactions(data || []);
            }
        } catch (error) {
            console.error('Error fetching user transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleViewTransactions = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        void fetchUserTransactions(user.id);
    };

    const filteredUsers = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return users.filter(
            (user) =>
                user.name?.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q),
        );
    }, [users, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'succeeded':
                return (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Success
                    </span>
                );
            case 'failed':
                return (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                        <XCircle className="w-2.5 h-2.5" /> Failed
                    </span>
                );
            default:
                return (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                );
        }
    };

    const columns: AdminColumn<User>[] = [
        {
            id: 'user',
            header: 'User',
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-extrabold text-brand-dark">
                            {user.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'role',
            header: 'Role',
            cell: (user) => (
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin'
                            ? 'bg-brand-dark/5 text-brand-dark border-brand-dark/10'
                            : user.role === 'hotel_admin' || user.role === 'hotel_staff'
                              ? 'bg-sky-50 text-sky-800 border-sky-100'
                              : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                    }`}
                >
                    {user.role === 'admin' ? (
                        <Shield className="w-3 h-3" />
                    ) : user.role === 'hotel_admin' || user.role === 'hotel_staff' ? (
                        <Hotel className="w-3 h-3" />
                    ) : (
                        <UserIcon className="w-3 h-3" />
                    )}
                    {roleLabel(user.role)}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (user) => {
                const st = statusLabel(user);
                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}
                    >
                        {st.text}
                    </span>
                );
            },
        },
        {
            id: 'joined',
            header: 'Joined',
            cell: (user) =>
                user.createdAt?.toDate
                    ? user.createdAt.toDate().toLocaleDateString()
                    : 'Not set',
        },
        {
            id: 'actions',
            header: 'Actions',
            align: 'right',
            cell: (user) => (
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
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Hotel className="w-4 h-4 mr-2" />
                            Assign hotel access
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark">User Management</h1>
                    <p className="text-gray-500 mt-1">
                        Manage accounts  use Edit Details to approve Hotel Admin access
                    </p>
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

            <AdminDataTable
                columns={columns}
                rows={filteredUsers}
                rowKey={(u) => u.id}
                loading={loading}
                loadingLabel="Loading users…"
                emptyLabel="No users match your search."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={filteredUsers.length}
                onPageChange={setPage}
            />

            <AssignHotelAdminModal
                user={editUser}
                open={!!editUser}
                preferCreateFromRequest={editUser?.hotelPartnerStatus === 'pending'}
                onClose={() => setEditUser(null)}
                onAssigned={() => {
                    setEditUser(null);
                    void fetchUsers();
                }}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Transaction History - ${selectedUser?.name || selectedUser?.email}`}
            >
                <div className="space-y-6 p-1">
                    {loadingTransactions ? (
                        <AdminLoader label="Fetching payment history…" />
                    ) : userTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {userTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-brand-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-0.5">
                                                #{tx.transaction_id.substring(0, 12)}...
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {tx.booking.booking_type.toUpperCase()} Booking
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                {new Date(tx.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-brand-dark mb-1">
                                            {tx.currency} {Number(tx.amount).toLocaleString()}
                                        </div>
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
                            <p className="text-gray-500 text-sm font-medium">
                                No transactions found for this user.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
