'use client';

import React, { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Hotel } from 'lucide-react';
import Link from 'next/link';
import { canAccessHotelPortal, canAccessSuperAdmin } from '@/lib/auth/admin-utils';
import type { HotelPartnerKyc } from '@/types/auth';
import { KycDocUploader } from '@/components/account/kyc-doc-uploader';
import { SignupStepRail } from '@/components/auth/signup-step-rail';
import {
    omitUndefinedDeep,
    validateHotelPayoutFields,
    validateHotelPropertyFields,
} from '@/lib/hotel-partner-kyc';

const STEPS = [
    'Property & legal',
    'KYC documents',
    'Payout (guest cuts)',
    'Billing & submit',
] as const;

/**
 * Multi-step hotel partner KYC  property → docs → payout draft → SaaS billing ack.
 * Activation / subscription payment happens after Super Admin approval in Hotel Portal Billing.
 */
export function HotelPartnerRequestForm() {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [legalBusinessName, setLegalBusinessName] = useState('');
    const [hotelName, setHotelName] = useState('');
    const [city, setCity] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [tin, setTin] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [ownershipRole, setOwnershipRole] = useState('owner');
    const [roomCount, setRoomCount] = useState('');
    const [message, setMessage] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [licenseUrl, setLicenseUrl] = useState('');
    const [taxUrl, setTaxUrl] = useState('');
    const [ownerIdUrl, setOwnerIdUrl] = useState('');
    const [accountName, setAccountName] = useState('');
    const [cbeAccount, setCbeAccount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ackBilling, setAckBilling] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!user) return null;
    if (canAccessSuperAdmin(user) || canAccessHotelPortal(user)) {
        return null;
    }

    const status = user.hotelPartnerStatus || 'none';

    if (status === 'draft') {
        return (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5">
                <div className="flex items-start gap-3">
                    <Hotel className="w-5 h-5 text-teal-700 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-brand-dark">
                            Finish hotel partner registration
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Your account is ready. Continue the stepped signup to add property
                            details, KYC documents, and payout info.
                        </p>
                        <Link
                            href="/signup?type=hotel_partner"
                            className="inline-block mt-3 text-sm font-semibold text-teal-800 hover:underline"
                        >
                            Continue registration →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                <div className="flex items-start gap-3">
                    <Hotel className="w-5 h-5 text-amber-700 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-brand-dark">
                            Hotel partner KYC under review
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Your application
                            {user.hotelPartnerRequest?.hotelName
                                ? ` for ${user.hotelPartnerRequest.hotelName}`
                                : ''}{' '}
                            is waiting for Super Admin document inspection. Hotel Portal
                            access stays locked until approval   then you can subscribe in
                            Billing (CBE Birr).
                        </p>
                        <Link
                            href="/partner/pending"
                            className="inline-block mt-3 text-sm font-semibold text-amber-900 hover:underline"
                        >
                            View application status →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const validateStep = (s: number): boolean => {
        if (s === 0) {
            const property = validateHotelPropertyFields({
                legalBusinessName,
                hotelName,
                tin,
                regNumber,
                city,
                phone,
                businessAddress,
                roomCount,
            });
            if (!property.ok) {
                toast.error(property.message || 'Complete property & legal fields');
                return false;
            }
            return true;
        }
        if (s === 1) {
            if (!logoUrl || !licenseUrl || !taxUrl || !ownerIdUrl) {
                toast.error(
                    'Upload logo, business license, tax certificate, and owner ID',
                );
                return false;
            }
            return true;
        }
        if (s === 2) {
            const payout = validateHotelPayoutFields({
                accountName,
                cbeAccount,
                bankName,
                accountNumber,
            });
            if (!payout.ok) {
                toast.error(payout.message || 'Complete payout details');
                return false;
            }
            return true;
        }
        if (s === 3) {
            if (!ackBilling) {
                toast.error('Please acknowledge the SaaS subscription terms');
                return false;
            }
            return true;
        }
        return true;
    };

    const onSubmit = async () => {
        if (!db || !validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) {
            return;
        }
        const property = validateHotelPropertyFields({
            legalBusinessName,
            hotelName,
            tin,
            regNumber,
            city,
            phone,
            businessAddress,
            roomCount,
        });
        const payout = validateHotelPayoutFields({
            accountName,
            cbeAccount,
            bankName,
            accountNumber,
        });
        if (!property.ok || !payout.ok) return;

        setSaving(true);
        try {
            const name = hotelName.trim();
            const kyc: HotelPartnerKyc = omitUndefinedDeep({
                legalBusinessName: legalBusinessName.trim(),
                tradeName: name,
                businessRegistrationNumber: regNumber.trim(),
                tin: property.tin!,
                businessAddress: businessAddress.trim(),
                city: city.trim(),
                country: 'ET',
                contactPhone: property.phone!,
                contactEmail: user.email || undefined,
                logoUrl,
                businessLicenseUrl: licenseUrl,
                taxCertificateUrl: taxUrl,
                ownerIdUrl,
                ownershipRole,
                declaredRoomCount: Number(roomCount),
                payoutDraft: omitUndefinedDeep({
                    accountName: accountName.trim(),
                    cbeAccount: payout.cbeAccount!,
                    bankName: bankName.trim(),
                    accountNumber: payout.accountNumber,
                }),
                acknowledgedSaaSBilling: true,
            });
            await updateDoc(
                doc(db, 'users', user.id),
                omitUndefinedDeep({
                    hotelPartnerStatus: 'pending',
                    role: 'user',
                    hotelPartnerRequest: {
                        hotelName: name,
                        city: city.trim() || null,
                        phone: property.phone || null,
                        message: message.trim() || null,
                        preferredPlanCode:
                            user.hotelPartnerRequest?.preferredPlanCode || null,
                        kyc,
                        submittedAt: serverTimestamp(),
                    },
                    updatedAt: serverTimestamp(),
                }),
            );
            toast.success(
                'Submitted for Super Admin review. Hotel Portal stays locked until approval.',
            );
            window.location.href = '/partner/pending';
        } catch (err) {
            console.error(err);
            toast.error('Could not submit request');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 dark:border-slate-700">
            {status === 'rejected' && (
                <div className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2 text-sm text-red-800">
                    Previous request was declined. Update details and submit again.
                </div>
            )}
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                    <Hotel className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">List your hotel on BookAddis</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Property → KYC → payout for guest settlements → acknowledge SaaS
                        billing → Super Admin review → subscribe in Billing → go live.
                    </p>
                </div>
            </div>

            <SignupStepRail steps={STEPS} current={step} />

            {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Legal business name</Label>
                        <Input
                            value={legalBusinessName}
                            onChange={(e) => setLegalBusinessName(e.target.value)}
                            placeholder="As on registration certificate"
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Hotel / trade name</Label>
                        <Input
                            value={hotelName}
                            onChange={(e) => setHotelName(e.target.value)}
                            placeholder="e.g. Momona Hotel"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>TIN</Label>
                        <Input value={tin} onChange={(e) => setTin(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Business registration no.</Label>
                        <Input
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Contact phone</Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+251…"
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Business address</Label>
                        <Input
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Your role</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={ownershipRole}
                            onChange={(e) => setOwnershipRole(e.target.value)}
                        >
                            <option value="owner">Owner</option>
                            <option value="general_manager">General manager</option>
                            <option value="agent">Authorized agent</option>
                            <option value="reservation_desk">Reservation desk lead</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Declared room count</Label>
                        <Input
                            type="number"
                            min={1}
                            value={roomCount}
                            onChange={(e) => setRoomCount(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold text-brand-dark">
                        Required documents (KYC)
                    </p>
                    {(
                        [
                            ['Property logo', logoUrl, setLogoUrl, 'Upload logo'],
                            [
                                'Business license',
                                licenseUrl,
                                setLicenseUrl,
                                'Upload license',
                            ],
                            [
                                'Tax / TIN certificate',
                                taxUrl,
                                setTaxUrl,
                                'Upload tax certificate',
                            ],
                            [
                                'Authorized person ID',
                                ownerIdUrl,
                                setOwnerIdUrl,
                                'Upload ID',
                            ],
                        ] as const
                    ).map(([label, url, setUrl, btn]) => (
                        <div key={label} className="space-y-2">
                            <Label>{label}</Label>
                            {url ? (
                                <p className="text-xs text-green-700 truncate">Uploaded</p>
                            ) : null}
                            <KycDocUploader label={btn} onUploaded={setUrl} />
                        </div>
                    ))}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Where BookAddis will send your cut for prepaid guest bookings
                        (later). This is separate from the SaaS subscription you pay us.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Account name</Label>
                            <Input
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CBE account</Label>
                            <Input
                                value={cbeAccount}
                                onChange={(e) => setCbeAccount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bank name</Label>
                            <Input
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Other account number (optional)</Label>
                            <Input
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-slate-700 space-y-2">
                        <p className="font-semibold text-brand-dark">Two money flows</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            <li>
                                <strong>You → BookAddis:</strong> monthly SaaS subscription
                                (CBE Birr) for the hotel management system  paid in Billing
                                after approval.
                            </li>
                            <li>
                                <strong>Guests → BookAddis → you:</strong> prepaid booking
                                settlements to the payout account you provided (later).
                            </li>
                        </ul>
                    </div>
                    <label className="flex items-start gap-3 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={ackBilling}
                            onChange={(e) => setAckBilling(e.target.checked)}
                        />
                        <span>
                            I understand access activates only after a validated
                            subscription payment (or a Super Admin trial), and guest payouts
                            are separate from SaaS fees.
                        </span>
                    </label>
                    <div className="space-y-2">
                        <Label>Notes for Super Admin</Label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="PMS, star rating, existing Booking.com listing, etc."
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2 justify-between pt-1">
                <Button
                    type="button"
                    variant="outline"
                    disabled={step === 0 || saving}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                    Back
                </Button>
                {step < STEPS.length - 1 ? (
                    <Button
                        type="button"
                        onClick={() => {
                            if (validateStep(step)) setStep((s) => s + 1);
                        }}
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled={saving}
                        onClick={() => void onSubmit()}
                    >
                        {saving ? 'Submitting KYC…' : 'Submit for approval'}
                    </Button>
                )}
            </div>
        </div>
    );
}
