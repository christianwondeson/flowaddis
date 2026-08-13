'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@/types/auth';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    isKycPackageComplete,
    kycMissingLabels,
} from '@/lib/hotel-partner-kyc';
import { FileText, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DocKey = 'logo' | 'license' | 'tax' | 'ownerId';

const DOCS: {
    key: DocKey;
    label: string;
    url: (u: User | null | undefined) => string | undefined;
}[] = [
    {
        key: 'logo',
        label: 'Property logo',
        url: (u) => u?.hotelPartnerRequest?.kyc?.logoUrl,
    },
    {
        key: 'license',
        label: 'Business license',
        url: (u) => u?.hotelPartnerRequest?.kyc?.businessLicenseUrl,
    },
    {
        key: 'tax',
        label: 'Tax / TIN certificate',
        url: (u) => u?.hotelPartnerRequest?.kyc?.taxCertificateUrl,
    },
    {
        key: 'ownerId',
        label: 'Authorized person ID',
        url: (u) => u?.hotelPartnerRequest?.kyc?.ownerIdUrl,
    },
];

type Props = {
    user: User | null;
    open: boolean;
    onClose: () => void;
    onProceedApprove: (user: User) => void;
    onReject: (user: User, notes: string) => void;
    busy?: boolean;
};

/**
 * Super Admin must open/inspect each KYC document before approving portal access.
 */
export function HotelPartnerReviewModal({
    user,
    open,
    onClose,
    onProceedApprove,
    onReject,
    busy,
}: Props) {
    const [viewed, setViewed] = useState<Record<DocKey, boolean>>({
        logo: false,
        license: false,
        tax: false,
        ownerId: false,
    });
    const [active, setActive] = useState<DocKey>('logo');
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        if (!open) return;
        setViewed({ logo: false, license: false, tax: false, ownerId: false });
        setActive('logo');
        setRejectNotes('');
    }, [open, user?.id]);

    const kyc = user?.hotelPartnerRequest?.kyc;
    const complete = isKycPackageComplete(kyc);
    const missing = kycMissingLabels(kyc);
    const allViewed = useMemo(() => {
        if (!user) return false;
        return DOCS.every((d) => !d.url(user) || viewed[d.key]);
    }, [user, viewed]);
    const canApprove = Boolean(user && complete && allViewed);

    const activeUrl = user ? DOCS.find((d) => d.key === active)?.url(user) : '';
    const isPdf = Boolean(activeUrl?.toLowerCase().includes('.pdf'));

    if (!open || !user) return null;

    return (
        <Modal isOpen={open} onClose={onClose} title="Inspect partner KYC">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm space-y-1">
                    <p className="font-bold text-brand-dark">
                        {user.name || 'Applicant'} · {user.email}
                    </p>
                    <p className="text-slate-600">
                        {user.hotelPartnerRequest?.hotelName || 'Hotel'}
                        {user.hotelPartnerRequest?.city
                            ? ` · ${user.hotelPartnerRequest.city}`
                            : ''}
                        {user.hotelPartnerRequest?.preferredPlanCode
                            ? ` · Plan ${user.hotelPartnerRequest.preferredPlanCode}`
                            : ''}
                    </p>
                    <p className="text-slate-600">
                        Legal: {kyc?.legalBusinessName || ' '} · TIN:{' '}
                        {kyc?.tin || ' '} · Reg:{' '}
                        {kyc?.businessRegistrationNumber || ' '}
                    </p>
                    {kyc?.payoutDraft ? (
                        <p className="text-slate-600">
                            Payout: {kyc.payoutDraft.accountName || ' '} · CBE{' '}
                            {kyc.payoutDraft.cbeAccount || ' '}
                        </p>
                    ) : null}
                    {!complete ? (
                        <p className="text-amber-800 font-medium pt-1">
                            Incomplete package  missing: {missing.join(', ')}.
                            Reject or ask the partner to resubmit.
                        </p>
                    ) : (
                        <p className="text-teal-800 font-medium pt-1">
                            Open each document below. Approve unlocks Hotel Portal
                            only after inspection.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {DOCS.map((d) => {
                        const url = d.url(user);
                        return (
                            <button
                                key={d.key}
                                type="button"
                                disabled={!url}
                                onClick={() => {
                                    setActive(d.key);
                                    if (url) {
                                        setViewed((v) => ({
                                            ...v,
                                            [d.key]: true,
                                        }));
                                    }
                                }}
                                className={cn(
                                    'rounded-lg border px-3 py-1.5 text-xs font-semibold',
                                    active === d.key &&
                                        'border-teal-500 bg-teal-50 text-teal-900',
                                    viewed[d.key] &&
                                        active !== d.key &&
                                        'border-teal-200 text-teal-800',
                                    !url && 'opacity-40 cursor-not-allowed',
                                    url &&
                                        !viewed[d.key] &&
                                        active !== d.key &&
                                        'border-slate-200 text-slate-600',
                                )}
                            >
                                {viewed[d.key] ? '✓ ' : ''}
                                {d.label}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white min-h-[280px] flex items-center justify-center overflow-hidden">
                    {!activeUrl ? (
                        <p className="text-sm text-slate-500 p-6">
                            Document not uploaded
                        </p>
                    ) : isPdf ? (
                        <div className="w-full p-4 space-y-3 text-center">
                            <FileText className="w-10 h-10 mx-auto text-slate-400" />
                            <p className="text-sm text-slate-600">PDF document</p>
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={activeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                        setViewed((v) => ({
                                            ...v,
                                            [active]: true,
                                        }))
                                    }
                                >
                                    Open PDF in new tab
                                </a>
                            </Button>
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={activeUrl}
                            alt=""
                            className="max-h-[360px] w-full object-contain bg-slate-50"
                            onLoad={() =>
                                setViewed((v) => ({ ...v, [active]: true }))
                            }
                        />
                    )}
                </div>

                {!activeUrl ? null : (
                    <a
                        href={activeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
                        onClick={() =>
                            setViewed((v) => ({ ...v, [active]: true }))
                        }
                    >
                        <ImageIcon className="w-4 h-4" />
                        Open full size
                    </a>
                )}

                <div className="space-y-2">
                    <Label htmlFor="reject-notes">Rejection notes (optional)</Label>
                    <textarea
                        id="reject-notes"
                        className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Why the application was rejected…"
                    />
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="text-red-600"
                        disabled={busy}
                        onClick={() => onReject(user, rejectNotes.trim())}
                    >
                        Reject & email
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApprove || busy}
                        title={
                            !complete
                                ? 'Incomplete KYC'
                                : !allViewed
                                  ? 'Inspect every document first'
                                  : 'Continue to assign hotel access'
                        }
                        onClick={() => onProceedApprove(user)}
                    >
                        Approve → assign hotel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
