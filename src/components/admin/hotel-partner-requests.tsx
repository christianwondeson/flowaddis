'use client';

import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Hotel, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/types/auth';
import { AssignHotelAdminModal } from '@/components/admin/assign-hotel-admin-modal';
import { HotelPartnerReviewModal } from '@/components/admin/hotel-partner-review-modal';
import { isKycPackageComplete } from '@/lib/hotel-partner-kyc';
import { notifyHotelPartner } from '@/lib/partner-notify-client';

/**
 * Super Admin queue: inspect KYC → approve (assign hotel) or reject + email.
 * Hotel portal stays locked until approved + membership.
 */
export function HotelPartnerRequests() {
    const [requests, setRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [inspectUser, setInspectUser] = useState<User | null>(null);
    const [assignUser, setAssignUser] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);

    const fetchRequests = async () => {
        try {
            if (!db) return;
            const q = query(
                collection(db, 'users'),
                where('hotelPartnerStatus', '==', 'pending'),
            );
            const snap = await getDocs(q);
            const rows: User[] = [];
            snap.forEach((d) => {
                rows.push({ id: d.id, ...d.data() } as User);
            });
            setRequests(rows);
        } catch (error) {
            console.error('Error fetching hotel partner requests:', error);
            toast.error('Failed to load hotel partner requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRequests();
    }, []);

    const handleReject = async (user: User, notes: string) => {
        setBusy(true);
        try {
            if (!db) return;
            await updateDoc(doc(db, 'users', user.id), {
                hotelPartnerStatus: 'rejected',
                hotelPartnerDecisionNotes: notes || null,
                updatedAt: serverTimestamp(),
            });
            try {
                await notifyHotelPartner({
                    to: user.email,
                    userName: user.name || user.email,
                    hotelName:
                        user.hotelPartnerRequest?.hotelName || 'your hotel',
                    decision: 'rejected',
                    notes: notes || undefined,
                });
                toast.info(`Rejected and emailed ${user.name || user.email}`);
            } catch (mailErr) {
                console.error(mailErr);
                toast.warning(
                    'Rejected in system, but email failed   check SMTP / Nest API.',
                );
            }
            setInspectUser(null);
            void fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error('Failed to reject request');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-8 p-6 text-center text-gray-500">
                Loading hotel partner requests…
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Hotel className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Hotel Partner Requests
                            </h2>
                            <p className="text-sm text-gray-500">
                                No pending KYC applications. Partners cannot open
                                the Hotel Portal until you inspect documents and
                                approve.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-sky-100 bg-sky-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-sky-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Hotel Partner KYC queue
                            </h2>
                            <p className="text-sm text-gray-500">
                                {requests.length} awaiting document inspection  
                                portal access stays locked until you approve
                            </p>
                        </div>
                    </div>
                </div>
                <ul className="divide-y divide-gray-100">
                    {requests.map((u) => {
                        const complete = isKycPackageComplete(
                            u.hotelPartnerRequest?.kyc,
                        );
                        return (
                            <li
                                key={u.id}
                                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold text-brand-dark">
                                        {u.name || 'Unknown'} · {u.email}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-0.5">
                                        {u.hotelPartnerRequest?.hotelName ||
                                            'Hotel not named'}
                                        {u.hotelPartnerRequest?.city
                                            ? ` · ${u.hotelPartnerRequest.city}`
                                            : ''}
                                        {u.hotelPartnerRequest?.preferredPlanCode
                                            ? ` · ${u.hotelPartnerRequest.preferredPlanCode}`
                                            : ''}
                                    </div>
                                    <p
                                        className={
                                            complete
                                                ? 'text-xs text-teal-700 mt-1 font-medium'
                                                : 'text-xs text-amber-700 mt-1 font-medium'
                                        }
                                    >
                                        {complete
                                            ? 'KYC package complete   inspect before approve'
                                            : 'Incomplete KYC   reject or wait for resubmit'}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        onClick={() => setInspectUser(u)}
                                    >
                                        Inspect documents
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600"
                                        onClick={() => setInspectUser(u)}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Review / reject
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <HotelPartnerReviewModal
                user={inspectUser}
                open={!!inspectUser}
                busy={busy}
                onClose={() => setInspectUser(null)}
                onReject={(u, notes) => void handleReject(u, notes)}
                onProceedApprove={(u) => {
                    setInspectUser(null);
                    setAssignUser(u);
                }}
            />

            <AssignHotelAdminModal
                user={assignUser}
                open={!!assignUser}
                preferCreateFromRequest
                onClose={() => setAssignUser(null)}
                onAssigned={async (userId) => {
                    const u = assignUser;
                    setAssignUser(null);
                    void fetchRequests();
                    if (!u || u.id !== userId) return;
                    try {
                        const origin =
                            typeof window !== 'undefined'
                                ? window.location.origin
                                : 'https://bookaddis.com';
                        await notifyHotelPartner({
                            to: u.email,
                            userName: u.name || u.email,
                            hotelName:
                                u.hotelPartnerRequest?.hotelName || 'your hotel',
                            decision: 'approved',
                            portalUrl: `${origin}/admin/hotel`,
                        });
                        toast.success('Partner approved and confirmation emailed');
                    } catch (mailErr) {
                        console.error(mailErr);
                        toast.warning(
                            'Access granted, but confirmation email failed   check SMTP.',
                        );
                    }
                }}
            />
        </>
    );
}
