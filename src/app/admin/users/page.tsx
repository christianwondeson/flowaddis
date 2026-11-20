'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User, UserRole } from '@/types/auth';
import { parseUserRole } from '@/lib/auth/admin-utils';
import { validateEmail } from '@/lib/phone-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Search,
    Shield,
    User as UserIcon,
    MoreHorizontal,
    Mail,
    Phone,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Hotel,
    Pencil,
    Trash2,
    Filter,
    X,
    AlertTriangle,
    Loader2,
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
            return 'Regular User';
    }
}

function statusLabel(user: User): { text: string; className: string } {
    if (user.hotelPartnerStatus === 'pending') {
        return {
            text: 'Hotel partner pending',
            className: 'bg-sky-50 text-sky-800 border border-sky-200',
        };
    }
    if (user.adminStatus === 'pending') {
        return {
            text: 'Admin pending',
            className: 'bg-amber-50 text-amber-800 border border-amber-200',
        };
    }
    return {
        text: 'Active',
        className: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);

    // Modals
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
    const [assignHotelUser, setAssignHotelUser] = useState<User | null>(null);

    // Edit User Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'user' as UserRole,
        accountStatus: 'active',
    });
    const [savingEdit, setSavingEdit] = useState(false);

    // Delete User Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState(false);

    const fetchUsers = async () => {
        try {
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
                    name: String(data.name || ''),
                    phone: String(data.phone || ''),
                    emailVerified: Boolean(data.emailVerified),
                } as User);
            });
            setUsers(fetchedUsers);
            setPage(1);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users from database.');
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
        setIsTransactionsModalOpen(true);
        void fetchUserTransactions(user.id);
    };

    const handleOpenEdit = (user: User) => {
        setUserToEdit(user);
        let accStatus = 'active';
        if (user.hotelPartnerStatus === 'pending') accStatus = 'partner_pending';
        else if (user.adminStatus === 'pending') accStatus = 'admin_pending';

        setEditForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            accountStatus: accStatus,
        });
        setEditModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!userToEdit || !db) return;
        setSavingEdit(true);
        try {
            const userRef = doc(db, 'users', userToEdit.id);
            const updates: Record<string, unknown> = {
                name: editForm.name.trim(),
                phone: editForm.phone.trim() || null,
                role: editForm.role,
            };

            // Check if email was changed
            const originalEmail = (userToEdit.email || '').trim().toLowerCase();
            const nextEmail = editForm.email.trim().toLowerCase();
            const isEmailChanged = nextEmail !== '' && nextEmail !== originalEmail;

            if (isEmailChanged) {
                const emailCheck = validateEmail(nextEmail);
                if (!emailCheck.isValid) {
                    toast.error(emailCheck.error || 'Please enter a valid email address');
                    setSavingEdit(false);
                    return;
                }

                const token = await auth?.currentUser?.getIdToken();
                if (!token) {
                    toast.error('Authentication session expired. Please sign in again.');
                    setSavingEdit(false);
                    return;
                }

                const emailRes = await fetch('/api/users/update-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        targetUid: userToEdit.id,
                        newEmail: nextEmail,
                    }),
                });

                const emailData = await emailRes.json().catch(() => ({}));
                if (!emailRes.ok) {
                    toast.error(emailData.error || 'Failed to update email in Firebase Authentication');
                    setSavingEdit(false);
                    return;
                }
                updates.email = nextEmail;
            }

            if (editForm.accountStatus === 'partner_pending') {
                updates.hotelPartnerStatus = 'pending';
            } else if (editForm.accountStatus === 'admin_pending') {
                updates.adminStatus = 'pending';
            } else if (editForm.accountStatus === 'active') {
                if (userToEdit.hotelPartnerStatus === 'pending') {
                    updates.hotelPartnerStatus = 'approved';
                }
                if (userToEdit.adminStatus === 'pending') {
                    updates.adminStatus = 'approved';
                }
            }

            await updateDoc(userRef, updates);

            // Update in local state
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userToEdit.id
                        ? {
                              ...u,
                              name: editForm.name.trim(),
                              email: isEmailChanged ? nextEmail : u.email,
                              phone: editForm.phone.trim() || undefined,
                              role: editForm.role,
                              hotelPartnerStatus:
                                  editForm.accountStatus === 'partner_pending'
                                      ? 'pending'
                                      : editForm.accountStatus === 'active' &&
                                          u.hotelPartnerStatus === 'pending'
                                        ? 'approved'
                                        : u.hotelPartnerStatus,
                              adminStatus:
                                  editForm.accountStatus === 'admin_pending'
                                      ? 'pending'
                                      : editForm.accountStatus === 'active' &&
                                          u.adminStatus === 'pending'
                                        ? 'approved'
                                        : u.adminStatus,
                          }
                        : u,
                ),
            );

            toast.success(`User "${editForm.name || userToEdit.email}" updated successfully.`);
            setEditModalOpen(false);
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error((error as Error).message || 'Failed to update user.');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleOpenDelete = (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || !db) return;
        setDeletingUser(true);
        try {
            const userRef = doc(db, 'users', userToDelete.id);
            await deleteDoc(userRef);

            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            toast.success(
                `User "${userToDelete.name || userToDelete.email}" deleted successfully.`,
            );
            setDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error((error as Error).message || 'Failed to delete user.');
        } finally {
            setDeletingUser(false);
        }
    };

    const hasActiveFilters =
        searchTerm.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('all');
        setStatusFilter('all');
    };

    const filteredUsers = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        return users.filter((user) => {
            const matchesSearch =
                !q ||
                user.name?.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q) ||
                user.phone?.toLowerCase().includes(q) ||
                user.id.toLowerCase().includes(q);

            const matchesRole =
                roleFilter === 'all' || user.role === roleFilter;

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'partner_pending' &&
                    user.hotelPartnerStatus === 'pending') ||
                (statusFilter === 'admin_pending' &&
                    user.adminStatus === 'pending') ||
                (statusFilter === 'active' &&
                    user.hotelPartnerStatus !== 'pending' &&
                    user.adminStatus !== 'pending');

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, roleFilter, statusFilter]);

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
            header: 'User details',
            alwaysVisible: true,
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold shrink-0">
                        {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 text-sm">
                            {user.name || 'Unnamed user'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{user.email}</span>
                            {user.phone ? (
                                <>
                                    <span>·</span>
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{user.phone}</span>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'role',
            header: 'Account role',
            cell: (user) => (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        user.role === 'admin'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : user.role === 'hotel_admin'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : user.role === 'hotel_staff'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200',
                    )}
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
            header: 'Account status',
            cell: (user) => {
                const st = statusLabel(user);
                return (
                    <span
                        className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                            st.className,
                        )}
                    >
                        {st.text}
                    </span>
                );
            },
        },
        {
            id: 'joined',
            header: 'Date joined',
            cell: (user) =>
                user.createdAt?.toDate
                    ? user.createdAt.toDate().toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                      })
                    : 'Not set',
        },
        {
            id: 'actions',
            header: 'Actions',
            align: 'right',
            alwaysVisible: true,
            cell: (user) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                        >
                            <MoreHorizontal className="h-4 w-4 text-slate-600" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl">
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                            Manage user
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => handleOpenEdit(user)}
                            className="cursor-pointer"
                        >
                            <Pencil className="w-4 h-4 mr-2 text-teal-700" />
                            Edit user details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setAssignHotelUser(user)}
                            className="cursor-pointer"
                        >
                            <Hotel className="w-4 h-4 mr-2 text-sky-700" />
                            Assign hotel access
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleViewTransactions(user)}
                            className="cursor-pointer"
                        >
                            <CreditCard className="w-4 h-4 mr-2 text-slate-600" />
                            View transactions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleOpenDelete(user)}
                            className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2 text-rose-600" />
                            Delete user account
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    User Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage platform accounts, edit user roles, approve hotel partner requests, or remove users.
                </p>
            </div>

            {/* Clear Filter Controls Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Search Input */}
                        <div className="min-w-[240px] flex-1">
                            <Label htmlFor="search-user" className="text-xs font-bold text-slate-600 mb-1 block">
                                Search by Name, Email, or Phone
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="search-user"
                                    placeholder="Search users..."
                                    className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter by Role */}
                        <div className="w-44">
                            <Label htmlFor="filter-role" className="text-xs font-bold text-slate-600 mb-1 block">
                                Filter by Role
                            </Label>
                            <select
                                id="filter-role"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Super Admin</option>
                                <option value="hotel_admin">Hotel Admin</option>
                                <option value="hotel_staff">Hotel Staff</option>
                                <option value="user">Regular User</option>
                            </select>
                        </div>

                        {/* Filter by Status */}
                        <div className="w-48">
                            <Label htmlFor="filter-status" className="text-xs font-bold text-slate-600 mb-1 block">
                                Filter by Account Status
                            </Label>
                            <select
                                id="filter-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="partner_pending">Hotel Partner Pending</option>
                                <option value="admin_pending">Admin Pending</option>
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-slate-600 hover:text-slate-900 h-10"
                            onClick={clearFilters}
                        >
                            <X className="w-4 h-4 mr-1.5" />
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                        Showing <strong>{filteredUsers.length}</strong> of{' '}
                        <strong>{users.length}</strong> total users
                    </span>
                    {hasActiveFilters && (
                        <span className="text-teal-700 font-semibold">
                            Filters active
                        </span>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <AdminDataTable
                columns={columns}
                rows={filteredUsers}
                rowKey={(u) => u.id}
                loading={loading}
                loadingLabel="Loading users…"
                emptyLabel="No users found matching your filters."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={filteredUsers.length}
                onPageChange={setPage}
                columnPrefsKey="superadmin-users-table"
                minTableWidth={900}
            />

            {/* Edit User Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit User Details"
            >
                {userToEdit && (
                    <div className="space-y-4 text-sm">
                        <p className="text-xs text-slate-500">
                            Update account name, role, phone number, and access permissions for{' '}
                            <strong>{userToEdit.email}</strong>.
                        </p>

                        <div className="space-y-1">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="e.g. Abebe Bikila"
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit-email">Email Address</Label>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                        Firebase Auth Sync
                                    </span>
                                </div>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, email: e.target.value }))
                                    }
                                    placeholder="e.g. user@example.com"
                                    className="h-10 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <Input
                                    id="edit-phone"
                                    value={editForm.phone}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, phone: e.target.value }))
                                    }
                                    placeholder="e.g. +251 91 123 4567"
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="edit-role">Account Role</Label>
                                <select
                                    id="edit-role"
                                    value={editForm.role}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            role: e.target.value as UserRole,
                                        }))
                                    }
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="user">Regular User (Guest)</option>
                                    <option value="hotel_staff">Hotel Staff</option>
                                    <option value="hotel_admin">Hotel Admin (Property Owner)</option>
                                    <option value="admin">Super Admin (Platform Staff)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="edit-status">Account Status</Label>
                                <select
                                    id="edit-status"
                                    value={editForm.accountStatus}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            accountStatus: e.target.value,
                                        }))
                                    }
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="partner_pending">
                                        Hotel Partner Application Pending
                                    </option>
                                    <option value="admin_pending">
                                        Super Admin Verification Pending
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                className="rounded-xl"
                                disabled={savingEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleSaveUser()}
                                disabled={savingEdit}
                                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                            >
                                {savingEdit ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving changes…
                                    </>
                                ) : (
                                    'Save changes'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete User Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete User Account"
            >
                {userToDelete && (
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-bold">Permanent Deletion Warning</h4>
                                <p className="text-xs text-rose-700 leading-relaxed">
                                    Are you sure you want to delete the account for{' '}
                                    <strong>{userToDelete.name || userToDelete.email}</strong>{' '}
                                    (<code>{userToDelete.id}</code>)?
                                </p>
                                <p className="text-xs text-rose-700 leading-relaxed">
                                    This will permanently remove their profile and credentials from
                                    Firestore. Any linked hotel admin permissions will be revoked.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                                className="rounded-xl"
                                disabled={deletingUser}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleConfirmDelete()}
                                disabled={deletingUser}
                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                            >
                                {deletingUser ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting…
                                    </>
                                ) : (
                                    'Delete user account'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Assign Hotel Access Modal */}
            <AssignHotelAdminModal
                user={assignHotelUser}
                open={!!assignHotelUser}
                preferCreateFromRequest={assignHotelUser?.hotelPartnerStatus === 'pending'}
                onClose={() => setAssignHotelUser(null)}
                onAssigned={() => {
                    setAssignHotelUser(null);
                    void fetchUsers();
                }}
            />

            {/* Transactions History Modal */}
            <Modal
                isOpen={isTransactionsModalOpen}
                onClose={() => setIsTransactionsModalOpen(false)}
                title={`Transaction History - ${selectedUser?.name || selectedUser?.email || ''}`}
            >
                <div className="space-y-6 p-1">
                    {loadingTransactions ? (
                        <AdminLoader label="Fetching payment history…" />
                    ) : userTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {userTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between group hover:bg-white transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-500">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5 font-mono">
                                                #{tx.transaction_id.substring(0, 12)}...
                                            </div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {tx.booking.booking_type.toUpperCase()} Booking
                                            </div>
                                            <div className="text-[10px] text-slate-500">
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
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">
                                No transactions found for this user.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
