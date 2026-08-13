'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Building2, Mail } from 'lucide-react';
import { isHotelPartnerAwaitingApproval } from '@/lib/hotel-partner-kyc';

/**
 * Shown after KYC submit   partner is signed in as a normal user only.
 * Hotel Portal stays locked until Super Admin inspects docs and approves.
 */
export default function PartnerPendingPage() {
    const { user, logout } = useAuth();
    const awaiting = isHotelPartnerAwaitingApproval(user?.hotelPartnerStatus);
    const hotelName = user?.hotelPartnerRequest?.hotelName;

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 page-muted">
            <div className="max-w-lg w-full rounded-2xl border border-amber-100 bg-white shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5">
                        <Building2 className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-brand-dark">
                            Application under review
                        </h1>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                            {awaiting || !user ? (
                                <>
                                    Your hotel partner KYC
                                    {hotelName ? (
                                        <>
                                            {' '}
                                            for <strong>{hotelName}</strong>
                                        </>
                                    ) : null}{' '}
                                    is with BookAddis Super Admin. They must open and
                                    inspect your documents before you can use the Hotel
                                    Portal   you cannot log into the hotel system yet.
                                </>
                            ) : user?.hotelPartnerStatus === 'approved' ? (
                                <>
                                    You are approved.{' '}
                                    <Link
                                        href="/admin/hotel"
                                        className="font-semibold text-brand-primary hover:underline"
                                    >
                                        Open Hotel Portal
                                    </Link>
                                    .
                                </>
                            ) : (
                                <>
                                    Check your Profile for application status, or contact
                                    support.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5 text-teal-700" />
                    <span>
                        We will email <strong>{user?.email || 'you'}</strong> when a
                        decision is made. After approval, sign in again to access the
                        portal and complete Billing.
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href="/">Back to BookAddis</Link>
                    </Button>
                    {user ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => void logout()}
                        >
                            Sign out
                        </Button>
                    ) : (
                        <Button asChild className="rounded-xl">
                            <Link href="/signin">Sign in later</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
