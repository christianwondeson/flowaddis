'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import {
    Building2,
    MapPin,
    Navigation,
    Phone,
    Mail,
    Sparkles,
    Loader2,
} from 'lucide-react';

const COORDINATE_PRESETS = [
    { label: 'Addis Ababa - Bole Airport Area', lat: '8.9806000', lng: '38.7578000', city: 'Addis Ababa', subcity: 'Bole' },
    { label: 'Addis Ababa - Kazanchis / City Center', lat: '9.0182000', lng: '38.7667000', city: 'Addis Ababa', subcity: 'Kirkos' },
    { label: 'Addis Ababa - Piazza / Churchill', lat: '9.0345000', lng: '38.7525000', city: 'Addis Ababa', subcity: 'Arada' },
    { label: 'Bishoftu - Lakes Area', lat: '8.7523000', lng: '38.9785000', city: 'Bishoftu', subcity: 'Bishoftu' },
    { label: 'Hawassa - Lakeside Area', lat: '7.0504000', lng: '38.4955000', city: 'Hawassa', subcity: 'Hawassa' },
    { label: 'Bahir Dar - Lake Tana Area', lat: '11.5742000', lng: '37.3614000', city: 'Bahir Dar', subcity: 'Bahir Dar' },
];

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: (hotelId: string) => void;
};

export function RegisterDirectHotelModal({ open, onClose, onCreated }: Props) {
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [city, setCity] = useState('Addis Ababa');
    const [subcity, setSubcity] = useState('');
    const [country, setCountry] = useState('ET');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [starRating, setStarRating] = useState('4');
    const [currency, setCurrency] = useState('ETB');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(7));
                setLongitude(pos.coords.longitude.toFixed(7));
                setDetecting(false);
                toast.success('GPS coordinates detected!');
            },
            (err) => {
                setDetecting(false);
                toast.error(`Could not detect location: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const handleApplyPreset = (p: typeof COORDINATE_PRESETS[0]) => {
        setLatitude(p.lat);
        setLongitude(p.lng);
        setCity(p.city);
        if (!subcity) setSubcity(p.subcity);
        toast.info(`Applied ${p.label} coordinates`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error('Hotel name is required');
            return;
        }

        const latNum = latitude.trim() ? parseFloat(latitude) : null;
        const lngNum = longitude.trim() ? parseFloat(longitude) : null;

        if (latNum !== null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
            toast.error('Latitude must be between -90 and 90');
            return;
        }
        if (lngNum !== null && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
            toast.error('Longitude must be between -180 and 180');
            return;
        }

        setSubmitting(true);
        try {
            const token = await auth?.currentUser?.getIdToken();
            if (!token) throw new Error('Not signed in');

            const amenities: Record<string, unknown> = {};
            if (brand.trim()) amenities.brand = brand.trim();
            if (subcity.trim()) amenities.subcity = subcity.trim();
            if (phone.trim()) amenities.phone = phone.trim();
            if (email.trim()) amenities.email = email.trim();

            const res = await fetch('/api/admin/hotels', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: trimmedName,
                    city: city.trim() || 'Addis Ababa',
                    country: country.trim() || 'ET',
                    location: location.trim() || undefined,
                    latitude: latNum,
                    longitude: lngNum,
                    star_rating: starRating ? parseFloat(starRating) : 4,
                    default_currency: (currency || 'ETB').trim().toUpperCase(),
                    description: description.trim() || undefined,
                    inventory_source: 'bookaddis_direct',
                    status: 'draft',
                    amenities: Object.keys(amenities).length ? amenities : undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    (data as { error?: string; message?: string }).error ||
                        (data as { message?: string }).message ||
                        'Failed to register hotel',
                );
            }

            const hotelId = (data as { id?: string }).id || '';
            toast.success(`Direct hotel "${trimmedName}" registered successfully!`);
            onCreated(hotelId);
            onClose();
        } catch (err) {
            toast.error((err as Error).message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Register New Direct Hotel"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <p className="text-xs text-gray-500">
                    Register a new direct property on BookAddis. Enter official hotel name, address,
                    and GPS coordinates. The hotel will start in <strong>Draft</strong> status until
                    rooms & rates are added.
                </p>

                {/* Name & Brand */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="reg-name" className="text-xs font-bold text-gray-700">
                            Hotel Name *
                        </Label>
                        <Input
                            id="reg-name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Momona Hotel"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-brand" className="text-xs font-bold text-gray-700">
                            Brand / Chain (Optional)
                        </Label>
                        <Input
                            id="reg-brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g. Momona Hotels & Resorts"
                        />
                    </div>
                </div>

                {/* City, Subcity, Country */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="reg-city" className="text-xs font-bold text-gray-700">
                            City *
                        </Label>
                        <Input
                            id="reg-city"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Addis Ababa"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-subcity" className="text-xs font-bold text-gray-700">
                            Subcity / Area
                        </Label>
                        <Input
                            id="reg-subcity"
                            value={subcity}
                            onChange={(e) => setSubcity(e.target.value)}
                            placeholder="Bole / Kazanchis"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-country" className="text-xs font-bold text-gray-700">
                            Country Code
                        </Label>
                        <Input
                            id="reg-country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="ET"
                        />
                    </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1">
                    <Label htmlFor="reg-location" className="text-xs font-bold text-gray-700">
                        Street Address & Landmark
                    </Label>
                    <Input
                        id="reg-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Bole Medhanialem, across from Edna Mall"
                    />
                </div>

                {/* GPS Coordinates Section */}
                <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-brand-primary" />
                            <span className="text-xs font-bold text-brand-dark">
                                GPS Location Coordinates
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDetectLocation}
                            disabled={detecting}
                            className="text-[11px] h-7 bg-white font-semibold"
                        >
                            <Navigation className="w-3 h-3 mr-1 text-teal-600" />
                            {detecting ? 'Detecting…' : 'Use Current GPS'}
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label htmlFor="reg-lat" className="text-[11px] font-bold text-gray-600">
                                Latitude (e.g. 8.9806)
                            </Label>
                            <Input
                                id="reg-lat"
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="8.9806000"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="reg-lng" className="text-[11px] font-bold text-gray-600">
                                Longitude (e.g. 38.7578)
                            </Label>
                            <Input
                                id="reg-lng"
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="38.7578000"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">
                            Quick Area Presets:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {COORDINATE_PRESETS.slice(0, 4).map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => handleApplyPreset(p)}
                                    className="text-[10px] font-medium bg-white hover:bg-teal-100/70 border border-teal-200/80 rounded-md px-2 py-0.5 text-teal-900 transition-colors cursor-pointer"
                                >
                                    {p.label.split(' - ')[1] || p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rating & Currency */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="reg-stars" className="text-xs font-bold text-gray-700">
                            Star Rating
                        </Label>
                        <Input
                            id="reg-stars"
                            type="number"
                            min={0}
                            max={5}
                            step={0.5}
                            value={starRating}
                            onChange={(e) => setStarRating(e.target.value)}
                            placeholder="4"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-cur" className="text-xs font-bold text-gray-700">
                            Base Currency
                        </Label>
                        <Input
                            id="reg-cur"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="ETB"
                        />
                    </div>
                </div>

                {/* Contact Phone & Email */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="reg-phone" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-teal-600" />
                            Front Desk Phone
                        </Label>
                        <Input
                            id="reg-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+251 91 123 4567"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="reg-email" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-teal-600" />
                            Reservation Email
                        </Label>
                        <Input
                            id="reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="info@hotel.com"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <Label htmlFor="reg-desc" className="text-xs font-bold text-gray-700">
                        Description / Highlights
                    </Label>
                    <textarea
                        id="reg-desc"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief overview of the property, services, and guest experience…"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    />
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={submitting} className="font-bold">
                        {submitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Registering…
                            </>
                        ) : (
                            'Register Direct Hotel'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
