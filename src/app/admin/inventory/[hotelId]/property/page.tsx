'use client';

/**
 * Super Admin property editor — comprehensive hotel information, location,
 * GPS coordinates (latitude, longitude), contact, and operational hours.
 */
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminLoader } from '@/components/ui/admin-loader';
import { MapPin, Navigation, ExternalLink, Phone, Mail, Globe, Clock, Building } from 'lucide-react';
import Link from 'next/link';

type HotelForm = {
    name: string;
    brand: string;
    description: string;
    location: string;
    city: string;
    subcity: string;
    country: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    star_rating: string;
    default_currency: string;
    phone: string;
    email: string;
    website: string;
    check_in_time: string;
    check_out_time: string;
};

const COORDINATE_PRESETS = [
    { label: 'Addis Ababa - Bole Airport Area', lat: '8.9806000', lng: '38.7578000', city: 'Addis Ababa', subcity: 'Bole' },
    { label: 'Addis Ababa - Kazanchis / City Center', lat: '9.0182000', lng: '38.7667000', city: 'Addis Ababa', subcity: 'Kirkos' },
    { label: 'Addis Ababa - Piazza / Churchill', lat: '9.0345000', lng: '38.7525000', city: 'Addis Ababa', subcity: 'Arada' },
    { label: 'Bishoftu - Lakes Area', lat: '8.7523000', lng: '38.9785000', city: 'Bishoftu', subcity: 'Bishoftu' },
    { label: 'Hawassa - Lakeside Area', lat: '7.0504000', lng: '38.4955000', city: 'Hawassa', subcity: 'Hawassa' },
    { label: 'Bahir Dar - Lake Tana Area', lat: '11.5742000', lng: '37.3614000', city: 'Bahir Dar', subcity: 'Bahir Dar' },
];

function PropertyInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const section = searchParams.get('section') || 'basics';

    const [form, setForm] = useState<HotelForm>({
        name: '',
        brand: '',
        description: '',
        location: '',
        city: '',
        subcity: '',
        country: 'ET',
        postal_code: '',
        latitude: '',
        longitude: '',
        star_rating: '',
        default_currency: 'ETB',
        phone: '',
        email: '',
        website: '',
        check_in_time: '14:00',
        check_out_time: '11:00',
    });
    const [amenities, setAmenities] = useState<Record<string, unknown>>({});
    const [policies, setPolicies] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const h = await adminInventoryFetch<{
                    name?: string;
                    description?: string | null;
                    location?: string | null;
                    city?: string | null;
                    country?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    star_rating?: number | null;
                    default_currency?: string;
                    amenities?: Record<string, unknown> | null;
                    policies?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`);

                const am = h.amenities && typeof h.amenities === 'object' ? h.amenities : {};
                const pol = h.policies && typeof h.policies === 'object' ? h.policies : {};
                setAmenities(am);
                setPolicies(pol);

                setForm({
                    name: h.name || '',
                    brand: String(am.brand || am.brand_name || ''),
                    description: h.description || '',
                    location: h.location || '',
                    city: h.city || '',
                    subcity: String(am.subcity || am.neighborhood || ''),
                    country: h.country || 'ET',
                    postal_code: String(am.postal_code || am.zip || ''),
                    latitude: h.latitude != null ? String(h.latitude) : '',
                    longitude: h.longitude != null ? String(h.longitude) : '',
                    star_rating: h.star_rating != null ? String(h.star_rating) : '',
                    default_currency: h.default_currency || 'ETB',
                    phone: String(am.phone || am.contact_phone || ''),
                    email: String(am.email || am.contact_email || ''),
                    website: String(am.website || ''),
                    check_in_time: String(pol.checkInTime || pol.check_in_time || '14:00'),
                    check_out_time: String(pol.checkOutTime || pol.check_out_time || '11:00'),
                });
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((f) => ({
                    ...f,
                    latitude: pos.coords.latitude.toFixed(7),
                    longitude: pos.coords.longitude.toFixed(7),
                }));
                setDetectingLocation(false);
                toast.success('Current GPS coordinates detected!');
            },
            (err) => {
                setDetectingLocation(false);
                toast.error(`Could not detect location: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const handleApplyPreset = (p: typeof COORDINATE_PRESETS[0]) => {
        setForm((f) => ({
            ...f,
            latitude: p.lat,
            longitude: p.lng,
            city: f.city || p.city,
            subcity: f.subcity || p.subcity,
        }));
        toast.info(`Applied ${p.label} coordinates`);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Hotel name is required');
            return;
        }

        const latNum = form.latitude.trim() ? parseFloat(form.latitude) : null;
        const lngNum = form.longitude.trim() ? parseFloat(form.longitude) : null;

        if (latNum !== null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
            toast.error('Latitude must be a valid number between -90 and 90');
            return;
        }
        if (lngNum !== null && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
            toast.error('Longitude must be a valid number between -180 and 180');
            return;
        }

        setSaving(true);
        try {
            const nextAmenities = {
                ...amenities,
                brand: form.brand.trim() || undefined,
                subcity: form.subcity.trim() || undefined,
                postal_code: form.postal_code.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                website: form.website.trim() || undefined,
            };

            const nextPolicies = {
                ...policies,
                checkInTime: form.check_in_time.trim() || '14:00',
                checkOutTime: form.check_out_time.trim() || '11:00',
            };

            await adminInventoryFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim(),
                    location: form.location.trim(),
                    city: form.city.trim(),
                    country: form.country.trim() || 'ET',
                    latitude: latNum,
                    longitude: lngNum,
                    default_currency: (form.default_currency || 'ETB')
                        .trim()
                        .toUpperCase(),
                    amenities: nextAmenities,
                    policies: nextPolicies,
                    ...(form.star_rating === ''
                        ? { star_rating: null }
                        : { star_rating: Number(form.star_rating) }),
                }),
            });

            setAmenities(nextAmenities);
            setPolicies(nextPolicies);
            toast.success('Property updated: name, address, and GPS coordinates saved');
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <AdminLoader label="Loading property profile…" />;
    }

    const hasCoords = form.latitude.trim() && form.longitude.trim();
    const googleMapsUrl = hasCoords
        ? `https://www.google.com/maps?q=${encodeURIComponent(form.latitude)},${encodeURIComponent(form.longitude)}`
        : null;

    const base = `/admin/inventory/${hotelId}/property`;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header / Nav Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-brand-primary" />
                        <h1 className="text-xl font-extrabold text-brand-dark">
                            Property Settings: {form.name || 'Hotel Profile'}
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Super Admin: manage guest-facing hotel identity, address, and map coordinates.
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <Link
                        href={`${base}?section=basics`}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            section === 'basics' ? 'bg-white shadow-xs text-brand-dark font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Basics & Contact
                    </Link>
                    <Link
                        href={`${base}?section=location`}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            section === 'location' ? 'bg-white shadow-xs text-brand-dark font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Location & GPS
                    </Link>
                    <Link
                        href={`${base}?section=details`}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            section === 'details' ? 'bg-white shadow-xs text-brand-dark font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Details & Hours
                    </Link>
                </div>
            </div>

            <form
                onSubmit={save}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6"
            >
                {/* 1. BASICS & CONTACT */}
                {section === 'basics' && (
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-name" className="text-xs font-bold text-gray-700">
                                    Official Hotel Name *
                                </Label>
                                <Input
                                    id="super-prop-name"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    placeholder="e.g. Momona Hotel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-brand" className="text-xs font-bold text-gray-700">
                                    Brand / Chain Affiliation
                                </Label>
                                <Input
                                    id="super-prop-brand"
                                    value={form.brand}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, brand: e.target.value }))
                                    }
                                    placeholder="e.g. Momona Hotels"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="super-prop-desc" className="text-xs font-bold text-gray-700">
                                Property Description
                            </Label>
                            <textarea
                                id="super-prop-desc"
                                className="w-full min-h-[120px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Public hotel overview shown on BookAddis property pages…"
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Front Desk & Contact Info
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-prop-phone" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                                        Front Desk Phone
                                    </Label>
                                    <Input
                                        id="super-prop-phone"
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, phone: e.target.value }))
                                        }
                                        placeholder="+251 11 618 5747"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-prop-email" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                                        Reservations Email
                                    </Label>
                                    <Input
                                        id="super-prop-email"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, email: e.target.value }))
                                        }
                                        placeholder="reservations@hotel.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-prop-web" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-teal-600" />
                                        Official Website
                                    </Label>
                                    <Input
                                        id="super-prop-web"
                                        value={form.website}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, website: e.target.value }))
                                        }
                                        placeholder="https://momonahotel.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. LOCATION & GPS */}
                {section === 'location' && (
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-city" className="text-xs font-bold text-gray-700">
                                    City *
                                </Label>
                                <Input
                                    id="super-prop-city"
                                    required
                                    value={form.city}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, city: e.target.value }))
                                    }
                                    placeholder="Addis Ababa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-subcity" className="text-xs font-bold text-gray-700">
                                    Subcity / Neighborhood
                                </Label>
                                <Input
                                    id="super-prop-subcity"
                                    value={form.subcity}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, subcity: e.target.value }))
                                    }
                                    placeholder="e.g. Bole / Kazanchis"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-country" className="text-xs font-bold text-gray-700">
                                    Country Code
                                </Label>
                                <Input
                                    id="super-prop-country"
                                    value={form.country}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            country: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    maxLength={3}
                                    placeholder="ET"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="super-prop-loc" className="text-xs font-bold text-gray-700">
                                    Street Address / Landmark
                                </Label>
                                <Input
                                    id="super-prop-loc"
                                    value={form.location}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            location: e.target.value,
                                        }))
                                    }
                                    placeholder="Bole Road, near airport"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="super-prop-post" className="text-xs font-bold text-gray-700">
                                    Postal / ZIP Code
                                </Label>
                                <Input
                                    id="super-prop-post"
                                    value={form.postal_code}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            postal_code: e.target.value,
                                        }))
                                    }
                                    placeholder="1000"
                                />
                            </div>
                        </div>

                        {/* GPS Coordinates Section */}
                        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-4 sm:p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-brand-primary" />
                                        <h3 className="text-sm font-extrabold text-brand-dark">
                                            GPS Map Coordinates
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Accurate pin placement for guest search map, distance to airport, and navigation.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDetectLocation}
                                        disabled={detectingLocation}
                                        className="text-xs font-semibold bg-white"
                                    >
                                        <Navigation className="w-3.5 h-3.5 mr-1 text-teal-600" />
                                        {detectingLocation ? 'Detecting…' : 'Use Current GPS'}
                                    </Button>

                                    {googleMapsUrl && (
                                        <a
                                            href={googleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-white border border-teal-200 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            View Map Pin
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-lat" className="text-xs font-bold text-gray-700">
                                        Latitude (Decimal Degrees)
                                    </Label>
                                    <Input
                                        id="super-lat"
                                        type="number"
                                        step="any"
                                        value={form.latitude}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, latitude: e.target.value }))
                                        }
                                        placeholder="e.g. 8.9806000"
                                    />
                                    <p className="text-[11px] text-gray-400">Range: -90.0 to 90.0</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-lng" className="text-xs font-bold text-gray-700">
                                        Longitude (Decimal Degrees)
                                    </Label>
                                    <Input
                                        id="super-lng"
                                        type="number"
                                        step="any"
                                        value={form.longitude}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, longitude: e.target.value }))
                                        }
                                        placeholder="e.g. 38.7578000"
                                    />
                                    <p className="text-[11px] text-gray-400">Range: -180.0 to 180.0</p>
                                </div>
                            </div>

                            {/* Preset coordinate chips */}
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                    Quick Area Coordinates Presets:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {COORDINATE_PRESETS.map((p) => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => handleApplyPreset(p)}
                                            className="text-[11px] font-medium bg-white hover:bg-teal-100/70 border border-teal-200/80 rounded-lg px-2.5 py-1 text-teal-900 transition-colors cursor-pointer"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DETAILS & POLICIES */}
                {section === 'details' && (
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="super-stars" className="text-xs font-bold text-gray-700">
                                    Official Star Rating
                                </Label>
                                <Input
                                    id="super-stars"
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    value={form.star_rating}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            star_rating: e.target.value,
                                        }))
                                    }
                                    placeholder="4"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Stars displayed on BookAddis search results.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="super-cur" className="text-xs font-bold text-gray-700">
                                    Default Base Currency
                                </Label>
                                <Input
                                    id="super-cur"
                                    value={form.default_currency}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            default_currency: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    maxLength={3}
                                    placeholder="ETB"
                                />
                                <p className="text-[11px] text-gray-400">
                                    Standard billing currency (ETB for Ethiopian properties).
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Standard Check-In / Check-Out Hours
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-checkin" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                                        Standard Check-In Time
                                    </Label>
                                    <Input
                                        id="super-checkin"
                                        type="time"
                                        value={form.check_in_time}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                check_in_time: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="super-checkout" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                                        Standard Check-Out Time
                                    </Label>
                                    <Input
                                        id="super-checkout"
                                        type="time"
                                        value={form.check_out_time}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                check_out_time: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
                    <p className="text-xs text-gray-400">
                        {section === 'location' && form.latitude && form.longitude
                            ? `Coordinates: ${form.latitude}, ${form.longitude}`
                            : 'Updates sync immediately to the database.'}
                    </p>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto font-bold text-xs">
                        {saving ? 'Saving changes…' : 'Save Property Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function SuperAdminPropertyPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading property…" />}>
            <PropertyInner />
        </Suspense>
    );
}
