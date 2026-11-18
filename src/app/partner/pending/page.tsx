'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Building2, Mail, FileText } from 'lucide-react';
import { isHotelPartnerAwaitingApproval } from '@/lib/hotel-partner-kyc';
import { Modal } from '@/components/ui/modal';
import { HotelDigitalAgreementViewer } from '@/components/partner/hotel-digital-agreement';

/**
 * Shown after KYC submit   partner is signed in as a normal user only.
 * Hotel Portal stays locked until Super Admin inspects docs and approves.
 */
export default function PartnerPendingPage() {
    const { user, logout } = useAuth();
    const [showAgreement, setShowAgreement] = useState(false);
    const awaiting = isHotelPartnerAwaitingApproval(user?.hotelPartnerStatus);
    const hotelName = user?.hotelPartnerRequest?.hotelName;
    const kyc = user?.hotelPartnerRequest?.kyc;

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 page-muted">
            <div className="max-w-xl w-full rounded-2xl border border-amber-100 bg-white shadow-sm p-6 sm:p-8 space-y-4">
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
                                    inspect your documents and executed digital agreement before you can use the Hotel
                                    Portal.
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

                {kyc?.digitalAgreement && (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                            <span className="font-bold text-teal-900 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-brand-primary" />
                                <span>Digital Agreement Executed</span>
                            </span>
                            <p className="text-slate-600">
                                Signatory: <strong>{kyc.digitalAgreement.signatoryName}</strong> ({kyc.digitalAgreement.signatoryTitle})
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAgreement(true)}
                            className="rounded-xl text-xs bg-white text-brand-primary border-teal-200 hover:bg-teal-50 shadow-xs"
                        >
                            View Agreement
                        </Button>
                    </div>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5 text-teal-700" />
                    <span>
                        We will email <strong>{user?.email || 'you'}</strong> when a
                        decision is made. After approval, sign in again to open the
                        hotel portal, finish property content, and go live when Super
                        Admin publishes your hotel.
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

                {/* Agreement View Modal */}
                {kyc?.digitalAgreement && (
                    <Modal
                        isOpen={showAgreement}
                        onClose={() => setShowAgreement(false)}
                        title="Executed Merchant Partnership Agreement"
                    >
                        <div className="max-h-[75vh] overflow-y-auto pr-1">
                            <HotelDigitalAgreementViewer
                                readOnly
                                data={{
                                    legalBusinessName: kyc.legalBusinessName || '',
                                    hotelName: hotelName || '',
                                    tin: kyc.tin || '',
                                    regNumber: kyc.businessRegistrationNumber || '',
                                    city: kyc.city || '',
                                    businessAddress: kyc.businessAddress || '',
                                    phone: kyc.contactPhone || '',
                                    roomCount: kyc.declaredRoomCount,
                                    accountName: kyc.payoutDraft?.accountName || '',
                                    cbeAccount: kyc.payoutDraft?.cbeAccount || '',
                                    bankName: kyc.payoutDraft?.bankName || '',
                                    ownershipRole: kyc.ownershipRole,
                                }}
                                initialAgreement={kyc.digitalAgreement}
                                onSignComplete={() => {}}
                            />
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}
