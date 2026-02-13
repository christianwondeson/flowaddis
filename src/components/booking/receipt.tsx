"use client";

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

interface BookingDetails {
    id: string;
    clientName: string;
    email: string;
    service: string;
    date: string;
    amount: number;
    status: 'Confirmed' | 'Pending';
}

interface ReceiptProps {
    booking: BookingDetails;
    onClose?: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ booking, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

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
            pdf.save(`Bookaddis-Receipt-${booking.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-green-100">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Booking Confirmed</span>
            </div>

            {/* Receipt Card */}
            <div
                ref={receiptRef}
                className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full relative overflow-hidden"
            >
                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary" />

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-2">
                        <Logo size="lg" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Official Digital Receipt</p>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <span className="text-gray-500 font-medium">Booking ID</span>
                        <span className="font-mono font-bold text-brand-dark bg-gray-50 px-2 py-1 rounded">{booking.id}</span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Client</span>
                            <span className="font-bold text-brand-dark">{booking.clientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Service</span>
                            <span className="font-bold text-brand-dark">{booking.service}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-bold text-brand-dark">{booking.date}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500">Amount Paid</span>
                            <span className="font-extrabold text-2xl text-brand-primary">${booking.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-100">
                        <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    id: booking.id,
                                    client: booking.clientName,
                                    service: booking.service,
                                    date: booking.date,
                                })}
                                size={120}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-3 font-medium">Scan to verify booking</p>
                    </div>

                    <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-50 mt-4">
                        <p>Generated on {new Date().toLocaleDateString()}</p>
                        <p className="mt-1">Thank you for choosing BookAddis</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full">
                <Button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                </Button>
                {onClose && (
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Close
                    </Button>
                )}
            </div>
        </div>
    );
};
