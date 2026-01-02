import React from 'react';
import { Metadata } from 'next';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
    title: 'Contact Us | FlowAddis',
    description: 'Get in touch with FlowAddis for support, inquiries, or feedback.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero Section */}
            <section className="relative bg-brand-dark text-white py-20 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            Contact Us
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300">
                            We're here to help. Reach out anytime!
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Contact Information */}
                            <div>
                                <h2 className="text-3xl font-bold text-brand-dark mb-8">Get In Touch</h2>
                                <p className="text-gray-600 mb-8">
                                    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">Phone</h3>
                                            <p className="text-gray-600">+251 911 520 275</p>
                                            <p className="text-sm text-gray-500">Mon-Fri 9am-6pm EAT</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">Email</h3>
                                            <p className="text-gray-600">info@flowaddis.com</p>
                                            <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">WhatsApp</h3>
                                            <a
                                                href="https://wa.me/251911520275"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-700 transition-colors"
                                            >
                                                Chat with us on WhatsApp
                                            </a>
                                            <p className="text-sm text-gray-500">Instant support</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">Office</h3>
                                            <p className="text-gray-600">Addis Ababa, Ethiopia</p>
                                            <p className="text-sm text-gray-500">Visit by appointment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="bg-white p-8 rounded-2xl shadow-xl">
                                <h3 className="text-2xl font-bold text-brand-dark mb-6">Send us a message</h3>
                                <form className="space-y-6">
                                    <div>
                                        <Input
                                            label="Full Name"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label="Phone (Optional)"
                                            type="tel"
                                            placeholder="+251 911 234 567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent">
                                            <option>General Inquiry</option>
                                            <option>Booking Support</option>
                                            <option>Partnership</option>
                                            <option>Feedback</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                            placeholder="Tell us how we can help..."
                                            required
                                        ></textarea>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-brand-dark mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">What are your business hours?</h3>
                                <p className="text-gray-600">We're available Monday to Friday, 9am-6pm EAT. For urgent matters, contact us via WhatsApp for faster response.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">How quickly will I get a response?</h3>
                                <p className="text-gray-600">We aim to respond to all inquiries within 24 hours. WhatsApp messages typically get faster responses.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">Can I visit your office?</h3>
                                <p className="text-gray-600">Yes! Please schedule an appointment by calling or emailing us first to ensure someone is available to assist you.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
