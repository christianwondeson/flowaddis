'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
    Download,
    CheckCircle2,
    CalendarDays,
    Mail,
    Phone,
    Hash,
    CreditCard,
    Building2,
    Printer,
    Copy,
    Check,
    ShieldCheck,
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
    phone?: string;
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
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const isReservation = kind === 'reservation' || booking.paymentMethod === 'pay_on_site';

    const generatedDate = new Date().toLocaleDateString(
        locale === 'am' ? 'am-ET' : 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' },
    );

    const currency = (
        String(booking.currency || 'ETB').toUpperCase() === 'USD' ? 'USD' : 'ETB'
    ) as 'ETB' | 'USD';
    const amountLabel = formatCurrency(Number(booking.amount) || 0, currency);
    const method = isReservation
        ? t('bookingUi.receipt.payAtHotelMethod')
        : (booking.paymentMethod &&
          paymentMethodLabel(booking.paymentMethod as PaymentSuccessMethod));

    const stayLabel =
        booking.checkIn && booking.checkOut
            ? `${formatStayDate(booking.checkIn, locale)} → ${formatStayDate(booking.checkOut, locale)}`
            : booking.date || formatStayDate(booking.checkIn, locale);

    const handleCopyId = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(booking.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 295));
            const prefix = isReservation ? 'Reservation' : 'Receipt';
            pdf.save(`BookAddis-${prefix}-${booking.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const qrPayload = isReservation
        ? JSON.stringify({
              doc: 'RESERVATION_VOUCHER',
              id: booking.id,
              guest: booking.clientName,
              service: booking.service,
              stay: stayLabel,
              due: booking.amount,
              currency,
              status: 'DUE_AT_CHECKIN',
          })
        : JSON.stringify({
              doc: 'PAYMENT_RECEIPT',
              id: booking.id,
              ref: booking.paymentReference || undefined,
              guest: booking.clientName,
              service: booking.service,
              paid: booking.amount,
              currency,
              status: 'PAID_CONFIRMED',
          });

    const Row = ({
        label,
        value,
        mono,
        icon,
    }: {
        label: string;
        value: React.ReactNode;
        mono?: boolean;
        icon?: React.ReactNode;
    }) => (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0">
                {icon}
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
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-receipt-card,
                    #printable-receipt-card * {
                        visibility: visible !important;
                    }
                    #printable-receipt-card {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 24px !important;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        background: white !important;
                        color: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Printable Receipt Card */}
            <div
                id="printable-receipt-card"
                ref={receiptRef}
                className="relative w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
                <div className="h-2 w-full bg-gradient-to-r from-brand-primary via-emerald-500 to-brand-primary" />

                <div className="space-y-4 p-5 sm:p-6">
                    {/* Header with integrated verified status */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                            <Logo size="md" />
                            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                {!isReservation
                                    ? t('bookingUi.receipt.officialReceipt')
                                    : t('bookingUi.receipt.reservationDoc')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <div
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                    !isReservation
                                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800'
                                        : 'bg-teal-50 text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-800'
                                }`}
                            >
                                <CheckCircle2
                                    className={`h-3.5 w-3.5 ${
                                        !isReservation ? 'text-emerald-600' : 'text-teal-600'
                                    }`}
                                />
                                {!isReservation
                                    ? t('bookingUi.receipt.bookingConfirmed')
                                    : t('bookingUi.receipt.reservationConfirmed')}
                            </div>
                            <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    !isReservation
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}
                            >
                                {!isReservation
                                    ? t('bookingUi.receipt.paidStatus')
                                    : t('bookingUi.receipt.unpaidStatus')}
                            </span>
                        </div>
                    </div>

                    {/* Booking Reference Hero Box */}
                    <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {t('bookingUi.receipt.bookingId')}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyId}
                                className="flex items-center gap-1 text-[10px] font-semibold text-brand-primary hover:text-teal-800 no-print"
                                title={t('bookingUi.receipt.copyId')}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span className="text-emerald-600">
                                            {t('bookingUi.receipt.copied')}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        <span>{t('bookingUi.receipt.copyId')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="mt-1 font-mono text-base font-bold tracking-wider text-slate-900 select-all">
                            {booking.id}
                        </p>

                        {/* Show payment reference ONLY for paid bookings */}
                        {!isReservation && booking.paymentReference && (
                            <div className="mt-2.5 border-t border-slate-200/60 pt-2 flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-400">
                                    {t('bookingUi.receipt.paymentRef')}:
                                </span>
                                <span className="font-mono font-semibold text-slate-700 select-all">
                                    {booking.paymentReference}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Financial Amount Box */}
                    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white px-4 py-3 ring-1 ring-slate-200/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {!isReservation
                                ? t('bookingUi.receipt.amountPaid')
                                : t('bookingUi.receipt.amountOnSite')}
                        </p>
                        <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-dark">
                            {amountLabel}
                        </p>
                        {method ? (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                {isReservation ? (
                                    <Building2 className="h-3.5 w-3.5 text-brand-primary" />
                                ) : (
                                    <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                                {method}
                            </p>
                        ) : null}
                    </div>

                    {/* Key Details Rows */}
                    <div className="divide-y divide-slate-100 text-xs">
                        <Row
                            label={t('bookingUi.receipt.client')}
                            value={booking.clientName}
                        />
                        {booking.email ? (
                            <Row
                                label={t('bookingUi.receipt.email')}
                                value={booking.email}
                                icon={<Mail className="h-3.5 w-3.5 text-slate-400" />}
                            />
                        ) : null}
                        {booking.phone ? (
                            <Row
                                label={t('bookingUi.receipt.phone')}
                                value={booking.phone}
                                icon={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                            />
                        ) : null}
                        <Row
                            label={t('bookingUi.receipt.service')}
                            value={booking.service}
                            icon={<Building2 className="h-3.5 w-3.5 text-slate-400" />}
                        />
                        <Row
                            label={
                                booking.checkIn && booking.checkOut
                                    ? t('bookingUi.receipt.stay')
                                    : t('bookingUi.receipt.date')
                            }
                            value={stayLabel}
                            icon={<CalendarDays className="h-3.5 w-3.5 text-slate-400" />}
                        />
                        <Row
                            label={t('bookingUi.receipt.paymentStatus')}
                            value={
                                !isReservation
                                    ? t('bookingUi.receipt.paidStatus')
                                    : t('bookingUi.receipt.unpaidStatus')
                            }
                            icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-400" />}
                        />
                    </div>

                    {/* Notice Box */}
                    {isReservation ? (
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs leading-relaxed text-amber-950">
                            <p className="font-semibold text-amber-900 mb-0.5">
                                {t('bookingUi.receipt.unpaidStatus')}
                            </p>
                            {t('bookingUi.receipt.payOnSiteNote')}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-900">
                            <p className="font-semibold text-emerald-800 mb-0.5">
                                {t('bookingUi.receipt.paidStatus')}
                            </p>
                            {t('bookingUi.receipt.paidNote')}
                        </div>
                    )}

                    {/* Official Digital QR Verification Box */}
                    <div className="flex flex-col items-center border-t border-slate-100 pt-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                            <QRCodeSVG
                                value={qrPayload}
                                size={110}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <p className="mt-2 text-[10px] font-semibold text-slate-400">
                            {isReservation
                                ? t('bookingUi.receipt.scanVerifyReservation')
                                : t('bookingUi.receipt.scanVerify')}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">
                        <p className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {t('bookingUi.receipt.generatedOn', {
                                date: generatedDate,
                            })}
                        </p>
                        <p className="mt-0.5 font-medium text-slate-500">
                            {t('bookingUi.receipt.thankYou')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex w-full flex-col sm:flex-row gap-2.5 no-print">
                <Button
                    onClick={() => void handleDownload()}
                    disabled={isDownloading}
                    className="h-11 flex-1 gap-2 rounded-xl bg-brand-primary text-white hover:bg-teal-700 shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    {isDownloading ? '…' : t('bookingUi.receipt.downloadPdf')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    className="h-11 flex-1 gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                    <Printer className="h-4 w-4 text-slate-600" />
                    {t('bookingUi.receipt.printVoucher')}
                </Button>
                {onClose && (
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-11 sm:w-24 rounded-xl text-slate-600 hover:bg-slate-100"
                    >
                        {t('bookingUi.receipt.close')}
                    </Button>
                )}
            </div>
        </div>
    );
};
