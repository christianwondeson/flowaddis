"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/types/auth';

export const AdminRequests = () => {
    const [requests, setRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            if (!db) return;
            const q = query(collection(db, "users"), where("adminStatus", "==", "pending"));
            const querySnapshot = await getDocs(q);
            const pendingUsers: User[] = [];
            querySnapshot.forEach((doc) => {
                pendingUsers.push({ id: doc.id, ...doc.data() } as User);
            });
            setRequests(pendingUsers);
        } catch (error) {
            console.error("Error fetching admin requests:", error);
            toast.error("Failed to load admin requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (userId: string, userName: string) => {
        try {
            if (!db) return;
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                role: 'admin',
                adminStatus: 'approved',
                updatedAt: serverTimestamp()
            });
            toast.success(`Approved admin access for ${userName}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Failed to approve request");
        }
    };

    const handleReject = async (userId: string, userName: string) => {
        try {
            if (!db) return;
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                adminStatus: 'rejected',
                updatedAt: serverTimestamp()
            });
            toast.info(`Rejected admin access for ${userName}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Failed to reject request");
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading requests...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <UserPlus className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Admin Access Requests</h2>
                            <p className="text-sm text-gray-500">No pending requests at the moment</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-orange-100 bg-orange-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <UserPlus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Admin Access Requests</h2>
                        <p className="text-sm text-gray-500">Pending approval for staff access</p>
                    </div>
                    <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {requests.length} Pending
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Requested</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-bold text-gray-900">{request.name || 'Unknown'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">{request.email}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500">
                                        {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(request.id, request.name || 'User')}
                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1.5" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReject(request.id, request.name || 'User')}
                                            className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Reject
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
