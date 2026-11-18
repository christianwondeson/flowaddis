'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FileText,
    CheckCircle2,
    RotateCcw,
    Printer,
    Download,
    Building2,
    ShieldCheck,
    CreditCard,
    Calendar,
    AlertCircle,
    PenTool,
    Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { HotelDigitalAgreement } from '@/types/auth';

export interface HotelAgreementData {
    legalBusinessName: string;
    hotelName: string;
    tin: string;
    regNumber?: string;
    city: string;
    businessAddress?: string;
    phone?: string;
    email?: string;
    roomCount?: string | number;
    accountName?: string;
    cbeAccount?: string;
    bankName?: string;
    ownershipRole?: string;
}

interface Props {
    data: HotelAgreementData;
    onSignComplete: (agreement: HotelDigitalAgreement) => void;
    initialAgreement?: HotelDigitalAgreement;
    readOnly?: boolean;
    className?: string;
}

const AGREEMENT_VERSION = '2026.1-ET';
const COMMISSION_PERCENT = 10;

export function HotelDigitalAgreementViewer({
    data,
    onSignComplete,
    initialAgreement,
    readOnly = false,
    className,
}: Props) {
    const [signMode, setSignMode] = useState<'draw' | 'type'>(
        initialAgreement?.signatureType || 'draw',
    );
    const [signatoryName, setSignatoryName] = useState(
        initialAgreement?.signatoryName || data.legalBusinessName || '',
    );
    const [signatoryTitle, setSignatoryTitle] = useState(
        initialAgreement?.signatoryTitle ||
            (data.ownershipRole === 'owner'
                ? 'Owner & Managing Director'
                : 'General Manager'),
    );
    const [signatoryIdNumber, setSignatoryIdNumber] = useState(
        initialAgreement?.signatoryIdNumber || '',
    );
    const [typedSignature, setTypedSignature] = useState(
        initialAgreement?.signatureType === 'type'
            ? initialAgreement.signatoryName
            : '',
    );
    const [hasDrawn, setHasDrawn] = useState(
        Boolean(initialAgreement?.signatureDataUrl && initialAgreement.signatureType === 'draw'),
    );
    const [acceptedTerms, setAcceptedTerms] = useState(
        Boolean(initialAgreement?.acceptedTerms),
    );

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const [expandedClauses, setExpandedClauses] = useState(false);

    // Initialize canvas if initial drawn signature exists
    useEffect(() => {
        if (!canvasRef.current || !initialAgreement?.signatureDataUrl) return;
        if (initialAgreement.signatureType !== 'draw') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
        };
        img.src = initialAgreement.signatureDataUrl;
    }, [initialAgreement]);

    // Canvas drawing setup with high-DPI scaling and touch events
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set display size
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    useEffect(() => {
        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => window.removeEventListener('resize', initCanvas);
    }, [initCanvas]);

    // Mouse / Touch drawing handlers
    const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        if ('clientX' in e) {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
        return { x: 0, y: 0 };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (readOnly) return;
        isDrawingRef.current = true;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || readOnly) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.closePath();
        emitAgreement();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    // Generate signature payload
    const emitAgreement = () => {
        if (readOnly) return;

        let signatureDataUrl = '';
        if (signMode === 'draw' && canvasRef.current && hasDrawn) {
            signatureDataUrl = canvasRef.current.toDataURL('image/png');
        } else if (signMode === 'type' && typedSignature.trim()) {
            signatureDataUrl = generateTypedSvg(typedSignature.trim());
        }

        const valid =
            Boolean(signatoryName.trim()) &&
            Boolean(signatoryTitle.trim()) &&
            Boolean(signatureDataUrl) &&
            acceptedTerms;

        if (valid) {
            const agreement: HotelDigitalAgreement = {
                agreementVersion: AGREEMENT_VERSION,
                legalBusinessName: data.legalBusinessName || '',
                tradeName: data.hotelName || '',
                tin: data.tin || '',
                businessRegistrationNumber: data.regNumber || '',
                businessAddress: data.businessAddress || '',
                city: data.city || '',
                cbeAccount: data.cbeAccount || '',
                bankName: data.bankName || '',
                signatoryName: signatoryName.trim(),
                signatoryTitle: signatoryTitle.trim(),
                signatoryIdNumber: signatoryIdNumber.trim() || undefined,
                signatureType: signMode,
                signatureDataUrl,
                signedAt: initialAgreement?.signedAt || new Date().toISOString(),
                commissionRatePercent: COMMISSION_PERCENT,
                acceptedTerms: true,
            };
            onSignComplete(agreement);
        }
    };

    const generateTypedSvg = (name: string): string => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
            <text x="20" y="50" font-family="'Brush Script MT', 'Dancing Script', cursive, serif" font-size="34" font-style="italic" fill="#0F172A">${name}</text>
        </svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    useEffect(() => {
        emitAgreement();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signMode, signatoryName, signatoryTitle, signatoryIdNumber, typedSignature, hasDrawn, acceptedTerms]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Top Certificate Header Banner */}
            <div className="rounded-2xl border border-teal-200 dark:border-teal-900 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-teal-950/40 dark:to-slate-900 p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-brand-primary text-white">
                                <FileText className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                                Official Digital Contract · Ver. {AGREEMENT_VERSION}
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-100">
                            BookAddis Hospitality Merchant Partnership Agreement
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                            Binding distribution, billing, and settlement terms between <strong>BookAddis Technologies PLC</strong> and <strong>{data.hotelName || 'Partner Hotel'}</strong>.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="rounded-xl text-xs gap-1.5 bg-white dark:bg-slate-800 shadow-xs"
                            title="Print or save as PDF"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print / PDF</span>
                        </Button>
                    </div>
                </div>

                {/* Key Summary Badges */}
                <div className="mt-4 pt-3 border-t border-teal-200/60 dark:border-teal-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Commission Rate</span>
                        <span className="font-extrabold text-brand-primary text-sm sm:text-base">10% per stayed booking</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Platform Fee</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">0 ETB / No SaaS fee</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Settlement Rail</span>
                        <span className="font-extrabold text-brand-dark dark:text-slate-100 truncate block">
                            CBE ({data.cbeAccount ? `...${data.cbeAccount.slice(-4)}` : 'Remittance'})
                        </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Governing Law</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Ethiopian Commercial Code</span>
                    </div>
                </div>
            </div>

            {/* Contract Body Document Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Contract Schedule & Operational Articles
                    </span>
                    <button
                        type="button"
                        onClick={() => setExpandedClauses(!expandedClauses)}
                        className="text-xs font-bold text-brand-primary hover:underline"
                    >
                        {expandedClauses ? 'Compact view' : 'Read full legal clauses'}
                    </button>
                </div>

                <div className="p-5 sm:p-7 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-h-[460px] overflow-y-auto">
                    {/* Parties Section */}
                    <div>
                        <h3 className="font-extrabold text-brand-dark dark:text-slate-100 uppercase text-xs tracking-wider mb-2">
                            1. Parties to the Agreement
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            This Commercial Distribution Agreement is entered into on this date between:
                        </p>
                        <div className="mt-2.5 grid sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                                <span className="font-bold text-brand-dark dark:text-slate-100 block mb-0.5">THE OPERATOR (BOOKADDIS)</span>
                                <p><strong>BookAddis Technologies PLC</strong></p>
                                <p>Registered OTA & Digital Merchant Operator</p>
                                <p>Addis Ababa, Ethiopia · support@bookaddis.com</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                                <span className="font-bold text-brand-dark dark:text-slate-100 block mb-0.5">THE HOTEL PARTNER</span>
                                <p><strong>{data.legalBusinessName || '[Legal Entity Name]'}</strong> (Trade: {data.hotelName})</p>
                                <p>TIN: <strong>{data.tin || '[10-digit TIN]'}</strong> {data.regNumber ? `· Reg: ${data.regNumber}` : ''}</p>
                                <p>{data.businessAddress || 'Addis Ababa'}, {data.city || 'Ethiopia'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Distribution & Parity */}
                    <div>
                        <h3 className="font-extrabold text-brand-dark dark:text-slate-100 uppercase text-xs tracking-wider mb-1.5">
                            2. Commercial Engagement & Rate Parity
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>
                                <strong>Direct Distribution:</strong> The Hotel grants BookAddis non-exclusive rights to market, confirm, and process reservations for its rooms, suites, and airport transfer shuttles.
                            </li>
                            <li>
                                <strong>Rate & Availability Parity:</strong> The Hotel guarantees that rates loaded into BookAddis will not exceed the rates publicly offered directly at the front desk or via other digital distribution channels.
                            </li>
                            <li>
                                <strong>Guaranteed Honor of Bookings:</strong> The Hotel strictly commits to honoring all confirmed BookAddis reservations (identified by unique PayNar code) with zero walk-outs or overbooking relocations.
                            </li>
                        </ul>
                    </div>

                    {/* Section 3: Billing & Invoicing Model */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <h3 className="font-extrabold text-emerald-900 dark:text-emerald-300 uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-emerald-700" />
                            <span>3. Billing, Commissions & Payout Model (Crucial)</span>
                        </h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                            <li>
                                <strong>No Recurring SaaS Fees:</strong> The Hotel is <em>never</em> billed a monthly software subscription, setup fee, or listing fee to access the BookAddis Hotel Portal.
                            </li>
                            <li>
                                <strong>Commission on Consumed Stays:</strong> BookAddis charges a flat <strong>10% commission</strong> strictly on completed, departed reservations. Validly cancelled bookings incur zero commission.
                            </li>
                            <li>
                                <strong>Monthly Statement Cycle:</strong> On the <strong>1st day of each calendar month</strong>, BookAddis issues an itemized commission statement for stays completed in the preceding month.
                            </li>
                            <li>
                                <strong>15-Day Settlement Window:</strong> The Hotel agrees to settle commission statement balances within <strong>15 calendar days</strong> of issuance via CBE Birr, bank transfer, or net settlement deduction.
                            </li>
                            <li>
                                <strong>Prepaid Guest Disbursements:</strong> For guest reservations prepaid via international card or CBE Birr, BookAddis disburses net room revenue directly to the Hotel’s designated CBE payout account (<strong>{data.cbeAccount || 'Designated Bank Account'}</strong>).
                            </li>
                        </ul>
                    </div>

                    {/* Section 4: Operational Rules & Shuttle Expectations */}
                    <div>
                        <h3 className="font-extrabold text-brand-dark dark:text-slate-100 uppercase text-xs tracking-wider mb-1.5">
                            4. Guest Standards, Check-In & Shuttle Rules
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>
                                <strong>Check-In Verification:</strong> The Hotel shall verify guest identity and booking reference (PayNar) smoothly at reception without demanding redundant re-payments for prepaid vouchers.
                            </li>
                            <li>
                                <strong>Airport Shuttle Protocol:</strong> For reservations containing airport transfers, the Hotel fleet must be properly licensed, GPS-monitored, and provide driver meet-and-greet at Bole International Airport (Terminal 1 or 2).
                            </li>
                            <li>
                                <strong>No-Show Reporting:</strong> In the event of a guest no-show, the Hotel must mark the reservation as 'No-Show' in the Hotel Portal within 24 hours of scheduled arrival.
                            </li>
                        </ul>
                    </div>

                    {/* Section 5: Legal, INSA Compliance & Termination */}
                    {expandedClauses && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-extrabold text-brand-dark dark:text-slate-100 uppercase text-xs tracking-wider mb-1.5">
                                    5. Regulatory Compliance & Data Security (INSA / NBE)
                                </h3>
                                <p className="text-xs">
                                    Both parties covenant to maintain compliance with Ethiopian Information Network Security Administration (INSA) data protection rules, National Bank of Ethiopia foreign exchange standards, and Ministry of Revenues tax obligations (VAT 15% and applicable service charges).
                                </p>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-brand-dark dark:text-slate-100 uppercase text-xs tracking-wider mb-1.5">
                                    6. Term & Mutual Termination
                                </h3>
                                <p className="text-xs">
                                    This agreement commences upon execution and administrative approval. Either party may terminate with 30 days written notice, provided all outstanding reservations and billing balances are fully honored and settled.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Interactive Digital Signature Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-extrabold text-brand-dark dark:text-slate-100 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-brand-primary" />
                        <span>Authorized Digital Execution & Signature</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Please provide the authorized legal representative’s name, title, and digital signature below to bind this agreement.
                    </p>
                </div>

                {/* Signatory Info Fields */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Signatory Full Name *
                        </Label>
                        <Input
                            value={signatoryName}
                            disabled={readOnly}
                            onChange={(e) => setSignatoryName(e.target.value)}
                            placeholder="Full Legal Name"
                            className="h-10 text-xs rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Official Title / Position *
                        </Label>
                        <Input
                            value={signatoryTitle}
                            disabled={readOnly}
                            onChange={(e) => setSignatoryTitle(e.target.value)}
                            placeholder="e.g. General Manager, Owner"
                            className="h-10 text-xs rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            National ID / Passport No.
                        </Label>
                        <Input
                            value={signatoryIdNumber}
                            disabled={readOnly}
                            onChange={(e) => setSignatoryIdNumber(e.target.value)}
                            placeholder="Fayda, Kebele or Passport"
                            className="h-10 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Signature Capture Mode Switcher */}
                {!readOnly && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                            <button
                                type="button"
                                onClick={() => setSignMode('draw')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all',
                                    signMode === 'draw'
                                        ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800',
                                )}
                            >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>Draw Signature</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignMode('type')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all',
                                    signMode === 'type'
                                        ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800',
                                )}
                            >
                                <Type className="w-3.5 h-3.5" />
                                <span>Type Legal Name</span>
                            </button>
                        </div>

                        {signMode === 'draw' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearCanvas}
                                className="text-xs text-slate-500 hover:text-rose-600 h-8"
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Clear signature
                            </Button>
                        )}
                    </div>
                )}

                {/* DRAW MODE CANVAS */}
                {signMode === 'draw' && (
                    <div className="space-y-2">
                        <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-2 overflow-hidden touch-none">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-32 sm:h-36 block cursor-crosshair bg-transparent"
                            />
                            {!hasDrawn && !readOnly && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs sm:text-sm">
                                    Sign here using your finger, stylus or mouse
                                </div>
                            )}
                            <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-400 font-mono">
                                Digitally verified · Timestamped
                            </div>
                        </div>
                    </div>
                )}

                {/* TYPE MODE INPUT */}
                {signMode === 'type' && !readOnly && (
                    <div className="space-y-2">
                        <Input
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="Type your exact legal name to sign..."
                            className="h-11 rounded-xl text-sm"
                        />
                        {typedSignature && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <span className="font-serif italic text-2xl sm:text-3xl text-brand-dark dark:text-slate-100 tracking-wide">
                                    {typedSignature}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                    Cryptographic Signatory
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* READONLY SIGNATURE DISPLAY */}
                {readOnly && initialAgreement?.signatureDataUrl && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={initialAgreement.signatureDataUrl}
                                alt="Signature"
                                className="max-h-16 w-auto object-contain"
                            />
                            <p className="text-xs font-bold text-brand-dark dark:text-slate-100 mt-1">
                                {initialAgreement.signatoryName} ({initialAgreement.signatoryTitle})
                            </p>
                        </div>
                        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                            <p className="font-semibold text-emerald-600">✓ Signed & Verified</p>
                            <p>{new Date(initialAgreement.signedAt).toLocaleString()}</p>
                            <p className="font-mono text-[10px]">Ver: {initialAgreement.agreementVersion}</p>
                        </div>
                    </div>
                )}

                {/* Legally Binding Confirmation Checkbox */}
                <div className="pt-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            disabled={readOnly}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded accent-brand-primary"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                            I declare under corporate authority that I am duly authorized to bind <strong>{data.legalBusinessName || data.hotelName || 'the Hotel'}</strong> to this BookAddis Merchant Agreement. I confirm our property agrees to the <strong>10% commission on stayed bookings</strong>, monthly statement settlement within 15 days, rate parity rules, and guaranteed booking fulfillment.
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}

