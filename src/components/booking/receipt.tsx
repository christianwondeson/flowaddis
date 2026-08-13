'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
    Download,
    CheckCircle2,
    CalendarDays,
    Mail,
    Hash,
    CreditCard,
    Building2,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { useTranslations } from '@/components/providers/locale-provider';
import { formatCurrency } from '@/lib/currency';
import {
    paymentMethodLabel,
    type PaymentSuccessMethod,
} from '@/lib/payment-success';

export interface BookingReceiptDetails {
    id: string;
    clientName: string;
    email: string;
    service: string;
    /** Stay / travel start */
    checkIn?: string;
    checkOut?: string;
    /** Legacy single date (flights) */
    date?: string;
    amount: number;
    currency?: 'ETB' | 'USD' | string;
    status: 'Confirmed' | 'Pending';
    paymentMethod?: PaymentSuccessMethod | string;
    paymentReference?: string | null;
}

interface ReceiptProps {
    booking: BookingReceiptDetails;
    onClose?: () => void;
    kind?: 'paid' | 'reservation';
}

function formatStayDate(iso: string | undefined, locale: string): string {
    if (!iso) return ' ';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export const Receipt: React.FC<ReceiptProps> = ({
    booking,
    onClose,
    kind = 'paid',
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const { t, locale } = useTranslations();
    const generatedDate = new Date().toLocaleDateString(
        locale === 'am' ? 'am-ET' : 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' },
    );

    const currency = (
        String(booking.currency || 'ETB').toUpperCase() === 'USD' ? 'USD' : 'ETB'
    ) as 'ETB' | 'USD';
    const amountLabel = formatCurrency(Number(booking.amount) || 0, currency);
    const method =
        booking.paymentMethod &&
        paymentMethodLabel(booking.paymentMethod as PaymentSuccessMethod);
    const stayLabel =
        booking.checkIn && booking.checkOut
            ? `${formatStayDate(booking.checkIn, locale)} → ${formatStayDate(booking.checkOut, locale)}`
            : booking.date || formatStayDate(booking.checkIn, locale);

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`BookAddis-${booking.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const Row = ({
        label,
        value,
        mono,
    }: {
        label: string;
        value: React.ReactNode;
        mono?: boolean;
    }) => (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-xs font-medium text-slate-500 shrink-0">
                {label}
            </span>
            <span
                className={`text-right text-sm font-semibold text-slate-900 ${
                    mono ? 'font-mono text-xs tracking-wide' : ''
                }`}
            >
                {value}
            </span>
        </div>
    );

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
            <div
                className={`mx-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    kind === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                        : 'bg-brand-primary/10 text-brand-dark ring-1 ring-brand-primary/20'
                }`}
            >
                <CheckCircle2
                    className={`h-4 w-4 ${
                        kind === 'paid' ? 'text-emerald-600' : 'text-brand-primary'
                    }`}
                />
                {kind === 'paid'
                    ? t('bookingUi.receipt.bookingConfirmed')
                    : t('bookingUi.receipt.reservationConfirmed')}
            </div>

            <div
                ref={receiptRef}
                className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]"
            >
                <div className="h-1.5 w-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary" />

                <div className="space-y-6 p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <Logo size="md" />
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                {kind === 'paid'
                                    ? t('bookingUi.receipt.officialReceipt')
                                    : t('bookingUi.receipt.reservationDoc')}
                            </p>
                        </div>
                        <div
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                kind === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-800'
                            }`}
                        >
                            {kind === 'paid' ? 'Paid' : 'Pay at hotel'}
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {kind === 'paid'
                                ? t('bookingUi.receipt.amountPaid')
                                : t('bookingUi.receipt.amountOnSite')}
                        </p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-dark">
                            {amountLabel}
                        </p>
                        {method ? (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                                {kind === 'reservation' ? (
                                    <Building2 className="h-3.5 w-3.5" />
                                ) : (
                                    <CreditCard className="h-3.5 w-3.5" />
                                )}
                                {method}
                            </p>
                        ) : null}
                    </div>

                    <div className="divide-y divide-slate-100">
                        <Row
                            label={t('bookingUi.receipt.bookingId')}
                            value={booking.id}
                            mono
                        />
                        {booking.paymentReference ? (
                            <Row
                                label={t('bookingUi.receipt.paymentRef')}
                                value={booking.paymentReference}
                                mono
                            />
                        ) : null}
                        <Row
                            label={t('bookingUi.receipt.client')}
                            value={booking.clientName}
                        />
                        {booking.email ? (
                            <div className="flex items-start justify-between gap-4 py-2.5">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Mail className="h-3.5 w-3.5" />
                                    {t('bookingUi.receipt.email')}
                                </span>
                                <span className="truncate text-right text-sm font-semibold text-slate-900">
                                    {booking.email}
                                </span>
                            </div>
                        ) : null}
                        <Row
                            label={t('bookingUi.receipt.service')}
                            value={booking.service}
                        />
                        <div className="flex items-start justify-between gap-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {booking.checkIn && booking.checkOut
                                    ? t('bookingUi.receipt.stay')
                                    : t('bookingUi.receipt.date')}
                            </span>
                            <span className="text-right text-sm font-semibold text-slate-900">
                                {stayLabel}
                            </span>
                        </div>
                    </div>

                    {kind === 'paid' && (
                        <div className="flex flex-col items-center border-t border-slate-100 pt-5">
                            <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        id: booking.id,
                                        ref: booking.paymentReference || undefined,
                                        amount: booking.amount,
                                        currency,
                                        guest: booking.clientName,
                                    })}
                                    size={112}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="mt-2.5 text-[11px] font-medium text-slate-400">
                                {t('bookingUi.receipt.scanVerify')}
                            </p>
                        </div>
                    )}

                    {kind === 'reservation' && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                            {t('bookingUi.receipt.payOnSiteNote')}
                        </div>
                    )}

                    <div className="border-t border-slate-50 pt-3 text-center text-[11px] text-slate-400">
                        <p className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {t('bookingUi.receipt.generatedOn', {
                                date: generatedDate,
                            })}
                        </p>
                        <p className="mt-1 font-medium text-slate-500">
                            {t('bookingUi.receipt.thankYou')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex w-full gap-3">
                {kind === 'paid' && (
                    <Button
                        onClick={() => void handleDownload()}
                        className="h-11 flex-1 gap-2 rounded-xl"
                    >
                        <Download className="h-4 w-4" />
                        {t('bookingUi.receipt.downloadPdf')}
                    </Button>
                )}
                {onClose && (
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className={`h-11 rounded-xl ${kind === 'paid' ? 'flex-1' : 'w-full'}`}
                    >
                        {t('bookingUi.receipt.close')}
                    </Button>
                )}
            </div>
        </div>
    );
};
