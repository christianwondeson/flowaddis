'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { KycDocUploader } from '@/components/account/kyc-doc-uploader';
import { toast } from 'sonner';
import {
    Building2,
    Check,
    FileText,
    Phone,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    hotelVerificationReady,
    withHotelVerification,
    type HotelVerification,
} from '@/lib/hotel-verification';
import { Preloader } from '@/components/ui/preloader';

const STEPS = [
    { id: 1, label: 'Property', icon: Building2 },
    { id: 2, label: 'Business docs', icon: FileText },
    { id: 3, label: 'Contact & review', icon: Phone },
] as const;

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: (hotelId: string) => void;
};

async function authHeaders(): Promise<HeadersInit> {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Super Admin  Booking.com / Agoda-style Direct hotel registration.
 * Creates Nest bookaddis_direct hotel with verification package; never
 * publishes without business license + tax + owner ID.
 */
export function HotelRegistrationWizard({ open, onClose, onCreated }: Props) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [city, setCity] = useState('');
    const [location, setLocation] = useState('');
    const [country, setCountry] = useState('ET');
    const [description, setDescription] = useState('');
    const [starRating, setStarRating] = useState('');
    const [currency, setCurrency] = useState('ETB');

    const [legalBusinessName, setLegalBusinessName] = useState('');
    const [tin, setTin] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [ownershipRole, setOwnershipRole] = useState('owner');
    const [roomCount, setRoomCount] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [licenseUrl, setLicenseUrl] = useState('');
    const [taxUrl, setTaxUrl] = useState('');
    const [ownerIdUrl, setOwnerIdUrl] = useState('');

    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [submitForReview, setSubmitForReview] = useState(true);

    const reset = () => {
        setStep(1);
        setName('');
        setBrand('');
        setCity('');
        setLocation('');
        setCountry('ET');
        setDescription('');
        setStarRating('');
        setCurrency('ETB');
        setLegalBusinessName('');
        setTin('');
        setRegNumber('');
        setBusinessAddress('');
        setOwnershipRole('owner');
        setRoomCount('');
        setLogoUrl('');
        setLicenseUrl('');
        setTaxUrl('');
        setOwnerIdUrl('');
        setContactPhone('');
        setContactEmail('');
        setWebsite('');
        setSubmitForReview(true);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const verificationDraft = (): HotelVerification => ({
        legalBusinessName: legalBusinessName.trim(),
        tradeName: name.trim(),
        businessRegistrationNumber: regNumber.trim(),
        tin: tin.trim(),
        businessAddress: businessAddress.trim() || location.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || 'ET',
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
        ownershipRole,
        declaredRoomCount: roomCount ? Number(roomCount) : undefined,
        logoUrl: logoUrl || undefined,
        businessLicenseUrl: licenseUrl || undefined,
        taxCertificateUrl: taxUrl || undefined,
        ownerIdUrl: ownerIdUrl || undefined,
    });

    const validateStep = (s: number): boolean => {
        if (s === 1) {
            if (!name.trim()) {
                toast.error('Property / trade name is required');
                return false;
            }
            if (!city.trim()) {
                toast.error('City is required');
                return false;
            }
            return true;
        }
        if (s === 2) {
            const gate = hotelVerificationReady(verificationDraft());
            if (!gate.ok) {
                toast.error(`Still needed: ${gate.missing.join(', ')}`);
                return false;
            }
            return true;
        }
        return true;
    };

    const next = () => {
        if (!validateStep(step)) return;
        setStep((x) => Math.min(3, x + 1));
    };

    const back = () => setStep((x) => Math.max(1, x - 1));

    const submit = async () => {
        if (!validateStep(1) || !validateStep(2)) {
            setStep(!name.trim() || !city.trim() ? 1 : 2);
            return;
        }
        const verification = verificationDraft();
        const gate = hotelVerificationReady(verification);
        if (!gate.ok) {
            toast.error(`Still needed: ${gate.missing.join(', ')}`);
            setStep(2);
            return;
        }

        setSaving(true);
        try {
            const headers = await authHeaders();
            const amenities: Record<string, unknown> = {};
            if (brand.trim()) amenities.brand = brand.trim();

            const media = withHotelVerification(
                logoUrl ? { photos: [{ url: logoUrl, caption: 'Logo', sort: 0 }] } : {},
                verification,
            );

            const status = submitForReview ? 'pending_review' : 'draft';

            const res = await fetch('/api/admin/hotels', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: name.trim(),
                    city: city.trim(),
                    location: location.trim() || undefined,
                    country: country.trim() || 'ET',
                    description: description.trim() || undefined,
                    default_currency: currency,
                    inventory_source: 'bookaddis_direct',
                    status,
                    ...(starRating !== ''
                        ? { star_rating: Number(starRating) }
                        : {}),
                    ...(Object.keys(amenities).length ? { amenities } : {}),
                    media,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    (data as { error?: string; message?: string }).error ||
                        (data as { message?: string }).message ||
                        'Create failed',
                );
            }
            const id = (data as { id?: string }).id;
            if (!id) throw new Error('Hotel created but no id returned');

            const dest = `/admin/inventory/${id}`;
            toast.success(
                submitForReview
                    ? 'Hotel registered and queued for review. Add rooms & rates, then publish when ready.'
                    : 'Hotel saved as draft. Complete rooms & rates, then publish when verification is ready.',
            );
            onCreated(id);
            handleClose();
            router.prefetch(dest);
            router.replace(dest);
            // Keep Preloader until navigation unmounts this tree.
            return;
        } catch (e) {
            toast.error((e as Error).message);
            setSaving(false);
        }
    };

    if (saving) {
        return (
            <Preloader
                fullScreen
                size="lg"
                label="Submitting hotel listing…"
            />
        );
    }

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Register hotel on BookAddis"
        >
            <div className="space-y-5 p-1 max-h-[min(80vh,720px)] overflow-y-auto">
                <p className="text-sm text-slate-600">
                    Same checklist pattern as major OTAs: property details → ownership
                    documents → contact → review. Publishing to guest search requires a
                    business license, tax certificate, and owner ID.
                </p>

                <ol className="flex gap-2">
                    {STEPS.map((s) => {
                        const Icon = s.icon;
                        const active = step === s.id;
                        const done = step > s.id;
                        return (
                            <li
                                key={s.id}
                                className={cn(
                                    'flex-1 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold',
                                    active
                                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                                        : done
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                          : 'border-slate-200 text-slate-500',
                                )}
                            >
                                <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
                                {s.label}
                            </li>
                        );
                    })}
                </ol>

                {step === 1 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>Property / trade name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Momona Hotel"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Brand (optional)</Label>
                            <Input
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="Momona Hotels"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>City *</Label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Addis Ababa"
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>Street address</Label>
                            <Input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Bole Road…"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Country</Label>
                            <Input
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Currency</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="ETB">ETB</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Star rating</Label>
                            <Input
                                type="number"
                                min={0}
                                max={5}
                                step={0.5}
                                value={starRating}
                                onChange={(e) => setStarRating(e.target.value)}
                                placeholder="4"
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>Short description</Label>
                            <textarea
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Guest-facing summary…"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Legal business name *</Label>
                                <Input
                                    value={legalBusinessName}
                                    onChange={(e) =>
                                        setLegalBusinessName(e.target.value)
                                    }
                                    placeholder="As on business license"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>TIN *</Label>
                                <Input
                                    value={tin}
                                    onChange={(e) => setTin(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Registration number *</Label>
                                <Input
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Registered business address</Label>
                                <Input
                                    value={businessAddress}
                                    onChange={(e) =>
                                        setBusinessAddress(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Your role</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={ownershipRole}
                                    onChange={(e) =>
                                        setOwnershipRole(e.target.value)
                                    }
                                >
                                    <option value="owner">Owner</option>
                                    <option value="general_manager">
                                        General manager
                                    </option>
                                    <option value="authorized_rep">
                                        Authorized representative
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Declared rooms (approx.)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={roomCount}
                                    onChange={(e) => setRoomCount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Required documents
                            </p>
                            {(
                                [
                                    ['Logo', logoUrl, setLogoUrl],
                                    [
                                        'Business license *',
                                        licenseUrl,
                                        setLicenseUrl,
                                    ],
                                    ['Tax / TIN certificate *', taxUrl, setTaxUrl],
                                    [
                                        'Owner / authorized ID *',
                                        ownerIdUrl,
                                        setOwnerIdUrl,
                                    ],
                                ] as const
                            ).map(([label, url, setUrl]) => (
                                <div
                                    key={label}
                                    className="flex flex-wrap items-center justify-between gap-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-brand-dark">
                                            {label}
                                        </p>
                                        {url ? (
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-brand-primary hover:underline truncate block max-w-[240px]"
                                            >
                                                Uploaded  view
                                            </a>
                                        ) : (
                                            <p className="text-xs text-slate-400">
                                                Not uploaded
                                            </p>
                                        )}
                                    </div>
                                    <KycDocUploader
                                        label={url ? 'Replace' : 'Upload'}
                                        onUploaded={setUrl}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Property phone</Label>
                                <Input
                                    value={contactPhone}
                                    onChange={(e) =>
                                        setContactPhone(e.target.value)
                                    }
                                    placeholder="+251…"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Property email</Label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) =>
                                        setContactEmail(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Website (optional)</Label>
                                <Input
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-2">
                            <p className="font-bold text-brand-dark flex items-center gap-2">
                                <Check className="w-4 h-4 text-brand-primary" />
                                Review
                            </p>
                            <p>
                                <span className="text-slate-500">Property:</span>{' '}
                                {name || ' '} · {city || ' '}
                            </p>
                            <p>
                                <span className="text-slate-500">Legal:</span>{' '}
                                {legalBusinessName || ' '} · TIN {tin || ' '}
                            </p>
                            <p>
                                <span className="text-slate-500">Docs:</span>{' '}
                                {[
                                    licenseUrl && 'License',
                                    taxUrl && 'Tax',
                                    ownerIdUrl && 'Owner ID',
                                    logoUrl && 'Logo',
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Incomplete'}
                            </p>
                        </div>

                        <label className="flex items-start gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={submitForReview}
                                onChange={(e) =>
                                    setSubmitForReview(e.target.checked)
                                }
                            />
                            <span>
                                Submit for review (
                                <code className="text-xs">pending_review</code>
                                ). Do not publish yet  assign a hotel admin, add
                                rooms & daily rates, then publish when ready.
                            </span>
                        </label>
                    </div>
                )}

                <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={step === 1 || saving}
                        onClick={back}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    {step < 3 ? (
                        <Button type="button" onClick={next}>
                            Continue
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={saving}
                            onClick={() => void submit()}
                        >
                            {saving ? 'Registering…' : 'Register hotel'}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
