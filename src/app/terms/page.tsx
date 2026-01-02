import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | FlowAddis',
    description: 'Terms and conditions for using FlowAddis services.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero Section */}
            <section className="relative bg-brand-dark text-white py-20 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            Terms of Service
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300">
                            Last updated: January 2, 2026
                        </p>
                    </div>
                </div>
            </section>

            {/* Terms Content */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto prose prose-lg">
                        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">1. Acceptance of Terms</h2>
                                <p className="text-gray-600">
                                    By accessing and using FlowAddis ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our services.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">2. Use of Service</h2>
                                <p className="text-gray-600 mb-3">
                                    FlowAddis provides a platform for booking flights, hotels, conference venues, and shuttle services in Ethiopia. You agree to:
                                </p>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                    <li>Provide accurate and complete information when making bookings</li>
                                    <li>Maintain the security of your account credentials</li>
                                    <li>Not use the service for any illegal or unauthorized purpose</li>
                                    <li>Comply with all applicable laws and regulations</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">3. Booking and Payments</h2>
                                <p className="text-gray-600 mb-3">
                                    When you make a booking through FlowAddis:
                                </p>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                    <li>All prices are displayed in the local currency and include applicable taxes unless stated otherwise</li>
                                    <li>Payment must be made in full at the time of booking</li>
                                    <li>You will receive a confirmation email with booking details</li>
                                    <li>Cancellation and refund policies vary by service provider</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">4. Cancellations and Refunds</h2>
                                <p className="text-gray-600">
                                    Cancellation policies are determined by the individual service providers (hotels, airlines, etc.). Please review the specific cancellation policy for your booking before confirming. FlowAddis acts as an intermediary and follows the policies set by our partners.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">5. User Accounts</h2>
                                <p className="text-gray-600 mb-3">
                                    To access certain features, you must create an account. You are responsible for:
                                </p>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                    <li>Maintaining the confidentiality of your password</li>
                                    <li>All activities that occur under your account</li>
                                    <li>Notifying us immediately of any unauthorized use</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">6. Intellectual Property</h2>
                                <p className="text-gray-600">
                                    All content on FlowAddis, including text, graphics, logos, and software, is the property of FlowAddis or its content suppliers and is protected by Ethiopian and international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">7. Limitation of Liability</h2>
                                <p className="text-gray-600">
                                    FlowAddis acts as an intermediary between you and service providers. We are not responsible for the quality, safety, or legality of the services provided by third parties. Our liability is limited to the amount paid for the booking.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">8. Privacy</h2>
                                <p className="text-gray-600">
                                    Your use of FlowAddis is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">9. Modifications to Terms</h2>
                                <p className="text-gray-600">
                                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the Service after changes are posted constitutes your acceptance of the modified terms.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">10. Governing Law</h2>
                                <p className="text-gray-600">
                                    These Terms of Service shall be governed by and construed in accordance with the laws of Ethiopia, without regard to its conflict of law provisions.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">11. Contact Information</h2>
                                <p className="text-gray-600">
                                    If you have any questions about these Terms of Service, please contact us:
                                </p>
                                <ul className="list-none pl-0 text-gray-600 space-y-2 mt-3">
                                    <li><strong>Email:</strong> info@flowaddis.com</li>
                                    <li><strong>Phone:</strong> +251 911 520 275</li>
                                    <li><strong>Address:</strong> Addis Ababa, Ethiopia</li>
                                </ul>
                            </div>

                            <div className="bg-brand-primary/5 p-6 rounded-xl border border-brand-primary/10">
                                <p className="text-sm text-gray-600">
                                    <strong>Note:</strong> By using FlowAddis, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
