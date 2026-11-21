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
    ExternalLink,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/locale-provider';
import { formatCurrency } from '@/lib/currency';
import {
    paymentMethodLabel,
    type PaymentSuccessMethod,
} from '@/lib/payment-success';

const LOGO_BASE64 =
    'data:image/webp;base64,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';

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

    // Official smartphone verification URL encoded in the QR code
    const origin =
        typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : 'https://bookaddis.com';
    const qrVerificationUrl = `${origin}/booking/success?bookingId=${encodeURIComponent(booking.id)}${isReservation ? '&type=reservation' : ''}${booking.paymentReference ? `&ref=${encodeURIComponent(booking.paymentReference)}` : ''}`;

    const handleCopyId = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(booking.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    /** Direct vector PDF fallback using jsPDF in case html2canvas fails in strict sandbox/browser */
    const generateDirectPdf = () => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const prefix = isReservation ? 'Reservation-Voucher' : 'Payment-Receipt';

            pdf.setFillColor(13, 148, 136); // brand teal
            pdf.rect(0, 0, 210, 8, 'F');

            pdf.setFontSize(22);
            pdf.setTextColor(15, 23, 42);
            pdf.text('BookAddis', 20, 25);

            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139);
            pdf.text(
                isReservation
                    ? 'OFFICIAL RESERVATION CONFIRMATION VOUCHER'
                    : 'OFFICIAL PAYMENT RECEIPT & CONFIRMATION',
                20,
                32,
            );

            pdf.setFontSize(11);
            pdf.setTextColor(13, 148, 136);
            pdf.text(
                isReservation ? 'CONFIRMED · PAY AT HOTEL' : 'PAID IN FULL · CONFIRMED',
                135,
                25,
            );

            pdf.setDrawColor(226, 232, 240);
            pdf.line(20, 36, 190, 36);

            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(20, 42, 170, 22, 3, 3, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            pdf.text('BOOKING IDENTIFIER (RESERVATION ID)', 25, 49);
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text(booking.id, 25, 58);

            pdf.setFillColor(241, 245, 249);
            pdf.roundedRect(20, 68, 170, 24, 3, 3, 'F');
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.text(
                isReservation ? 'AMOUNT DUE AT CHECK-IN' : 'AMOUNT PAID IN FULL',
                25,
                76,
            );
            pdf.setFontSize(18);
            pdf.setTextColor(15, 23, 42);
            pdf.text(amountLabel, 25, 86);

            let y = 104;
            const drawRow = (label: string, val: string) => {
                pdf.setFontSize(10);
                pdf.setTextColor(100, 116, 139);
                pdf.text(label, 20, y);
                pdf.setTextColor(15, 23, 42);
                pdf.setFont('helvetica', 'bold');
                pdf.text(val, 190, y, { align: 'right' });
                pdf.setFont('helvetica', 'normal');
                pdf.setDrawColor(241, 245, 249);
                pdf.line(20, y + 2, 190, y + 2);
                y += 9;
            };

            drawRow('Guest Full Name', booking.clientName || 'N/A');
            if (booking.email) drawRow('Guest Email', booking.email);
            if (booking.phone) drawRow('Guest Phone', booking.phone);
            drawRow('Stay / Service', booking.service || 'BookAddis Reservation');
            drawRow('Dates', stayLabel);
            if (!isReservation && booking.paymentReference) {
                drawRow('Payment Reference', booking.paymentReference);
            }
            drawRow(
                'Payment Status',
                isReservation ? 'Unpaid · Payable upon hotel arrival' : 'Paid in full',
            );

            y += 8;
            pdf.setFillColor(254, 243, 199);
            pdf.roundedRect(20, y, 170, 22, 3, 3, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(120, 53, 15);
            pdf.text(
                isReservation
                    ? 'Front Desk Check-in Notice: Your room is held. Present this confirmation voucher at the front desk'
                    : 'Confirmation Notice: Your booking is verified and confirmed. Present this voucher at check-in.',
                24,
                y + 8,
            );
            pdf.text(
                isReservation
                    ? 'upon check-in and settle the amount shown in the listing currency directly with the property.'
                    : 'Standard property policies apply. Valid government photo ID is required upon arrival.',
                24,
                y + 14,
            );

            y += 32;
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            pdf.text(
                `Generated on ${generatedDate} · Verification URL: ${origin}/booking/success?bookingId=${booking.id}`,
                20,
                y,
            );

            pdf.save(`BookAddis-${prefix}-${booking.id}.pdf`);
        } catch (e) {
            console.error('Direct PDF export error:', e);
        }
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: false,
                allowTaint: false,
                logging: false,
                scrollX: 0,
                scrollY: 0,
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
            console.warn(
                'html2canvas failed, seamlessly generating vector PDF voucher:',
                error,
            );
            generateDirectPdf();
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        if (!receiptRef.current) return;

        // Print via dedicated invisible iframe to bypass modal overflow-hidden clipping
        const frame = document.createElement('iframe');
        frame.setAttribute(
            'style',
            'position:fixed;top:-10000px;left:-10000px;width:900px;height:1200px;border:none;visibility:hidden;',
        );
        document.body.appendChild(frame);

        const doc = frame.contentWindow?.document;
        if (!doc) {
            window.print();
            return;
        }

        const cardContent = receiptRef.current.innerHTML;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>BookAddis ${isReservation ? 'Reservation Voucher' : 'Payment Receipt'} - ${booking.id}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 30px;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .voucher-wrapper {
                        max-width: 620px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        overflow: hidden;
                        background: #ffffff;
                    }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .items-start { align-items: flex-start; }
                    .justify-between { justify-content: space-between; }
                    .flex-col { flex-direction: column; }
                    .gap-1 { gap: 4px; }
                    .gap-1\\.5 { gap: 6px; }
                    .gap-2 { gap: 8px; }
                    .gap-3 { gap: 12px; }
                    .gap-4 { gap: 16px; }
                    .p-3 { padding: 12px; }
                    .p-3\\.5 { padding: 14px; }
                    .p-4 { padding: 16px; }
                    .p-5 { padding: 20px; }
                    .p-6 { padding: 24px; }
                    .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
                    .py-1 { padding-top: 4px; padding-bottom: 4px; }
                    .px-3 { padding-left: 12px; padding-right: 12px; }
                    .mt-1 { margin-top: 4px; }
                    .mt-1\\.5 { margin-top: 6px; }
                    .mt-2 { margin-top: 8px; }
                    .mb-0\\.5 { margin-bottom: 2px; }
                    .border-b { border-bottom: 1px solid #e2e8f0; }
                    .border-t { border-top: 1px solid #e2e8f0; }
                    .rounded-xl { border-radius: 12px; }
                    .rounded-2xl { border-radius: 16px; }
                    .rounded-full { border-radius: 9999px; }
                    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                    .font-bold { font-weight: 700; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    .text-xs { font-size: 12px; }
                    .text-sm { font-size: 14px; }
                    .text-base { font-size: 16px; }
                    .text-2xl { font-size: 24px; }
                    .text-3xl { font-size: 28px; }
                    .text-slate-400 { color: #94a3b8; }
                    .text-slate-500 { color: #64748b; }
                    .text-slate-600 { color: #475569; }
                    .text-slate-700 { color: #334155; }
                    .text-slate-900 { color: #0f172a; }
                    .text-brand-dark { color: #0f172a; }
                    .text-emerald-600 { color: #059669; }
                    .text-emerald-800 { color: #065f46; }
                    .text-amber-800 { color: #92400e; }
                    .text-amber-900 { color: #78350f; }
                    .text-amber-950 { color: #451a03; }
                    .bg-slate-50 { background-color: #f8fafc; }
                    .bg-white { background-color: #ffffff; }
                    .bg-emerald-50 { background-color: #ecfdf5; }
                    .bg-emerald-100 { background-color: #d1fae5; }
                    .bg-teal-50 { background-color: #f0fdf4; }
                    .bg-amber-50 { background-color: #fffbeb; }
                    .bg-amber-100 { background-color: #fef3c7; }
                </style>
            </head>
            <body>
                <div class="voucher-wrapper">
                    ${cardContent}
                </div>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(frame)) {
                    document.body.removeChild(frame);
                }
            }, 2000);
        }, 300);
    };

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
                    /* Unclip all ancestors for direct browser printing */
                    html,
                    body {
                        overflow: visible !important;
                        height: auto !important;
                        background: white !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    body:has(#printable-receipt-card),
                    #printable-receipt-card,
                    #printable-receipt-card * {
                        visibility: visible !important;
                    }
                    .fixed,
                    [class*="overflow-hidden"],
                    [class*="overflow-y-auto"],
                    [class*="max-h-"] {
                        position: static !important;
                        overflow: visible !important;
                        max-height: none !important;
                        height: auto !important;
                        width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #printable-receipt-card {
                        position: static !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 640px !important;
                        margin: 0 auto !important;
                        padding: 24px !important;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        background: white !important;
                        color: #0f172a !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
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
                <div className="h-2 w-full bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600" />

                <div className="space-y-4 p-5 sm:p-6">
                    {/* Header with integrated verified status */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                            {/* Inline base64 logo: immune to CORS, network failures and canvas taints */}
                            <div className="flex items-center gap-2">
                                <img
                                    src={LOGO_BASE64}
                                    alt="BookAddis"
                                    className="h-9 w-9 object-contain shrink-0"
                                    crossOrigin="anonymous"
                                />
                                <span className="font-extrabold text-xl tracking-tight text-teal-700 dark:text-teal-400">
                                    BookAddis
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
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
                    <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700/60">
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
                        <p className="mt-1 font-mono text-base sm:text-lg font-bold tracking-wider text-slate-900 dark:text-slate-100 select-all">
                            {booking.id}
                        </p>

                        {/* Show payment reference ONLY for paid bookings */}
                        {!isReservation && booking.paymentReference && (
                            <div className="mt-2.5 border-t border-slate-200/60 pt-2 flex items-center justify-between text-xs dark:border-slate-700">
                                <span className="font-medium text-slate-400">
                                    {t('bookingUi.receipt.paymentRef')}:
                                </span>
                                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 select-all">
                                    {booking.paymentReference}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Financial Amount Box */}
                    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white px-4 py-3 ring-1 ring-slate-200/80 dark:from-slate-850 dark:to-slate-900 dark:ring-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {!isReservation
                                ? t('bookingUi.receipt.amountPaid')
                                : t('bookingUi.receipt.amountOnSite')}
                        </p>
                        <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-dark dark:text-slate-100">
                            {amountLabel}
                        </p>
                        {method ? (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
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
                    <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
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
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                            <p className="font-semibold text-amber-900 dark:text-amber-300 mb-0.5">
                                {t('bookingUi.receipt.unpaidStatus')}
                            </p>
                            {t('bookingUi.receipt.payOnSiteNote')}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">
                                {t('bookingUi.receipt.paidStatus')}
                            </p>
                            {t('bookingUi.receipt.paidNote')}
                        </div>
                    )}

                    {/* Official Digital QR Verification Box */}
                    <div className="flex flex-col items-center border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                            <QRCodeSVG
                                value={qrVerificationUrl}
                                size={120}
                                level="M"
                                includeMargin={true}
                            />
                        </div>
                        <p className="mt-2 text-[10px] font-semibold text-slate-500">
                            {isReservation
                                ? t('bookingUi.receipt.scanVerifyReservation')
                                : t('bookingUi.receipt.scanVerify')}
                        </p>
                        <a
                            href={qrVerificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-brand-primary hover:underline no-print"
                        >
                            <span>Verify booking online</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 dark:border-slate-800">
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
            <div className="flex w-full flex-col sm:flex-row gap-2.5 pt-1 no-print">
                <Button
                    onClick={() => void handleDownload()}
                    disabled={isDownloading}
                    className="h-11 flex-1 gap-2 rounded-xl bg-brand-primary text-white hover:bg-teal-700 shadow-sm font-semibold"
                >
                    <Download className="h-4 w-4" />
                    {isDownloading ? '…' : t('bookingUi.receipt.downloadPdf')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    className="h-11 flex-1 gap-2 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold dark:border-slate-700 dark:hover:bg-slate-800"
                >
                    <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    {t('bookingUi.receipt.printVoucher')}
                </Button>
                {onClose && (
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-11 sm:w-24 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        {t('bookingUi.receipt.close')}
                    </Button>
                )}
            </div>
        </div>
    );
};
