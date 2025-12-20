import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-brand-dark text-white pt-20 pb-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Logo className="text-white" />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your premium gateway to Ethiopia. Experience seamless booking for flights, hotels, conferences, and transportation.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Services</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/flights" className="hover:text-brand-secondary transition-colors">International Flights</Link></li>
                            <li><Link href="/hotels" className="hover:text-brand-secondary transition-colors">Luxury Hotels</Link></li>
                            <li><Link href="/conferences" className="hover:text-brand-secondary transition-colors">Conference Halls</Link></li>
                            <li><Link href="/shuttles" className="hover:text-brand-secondary transition-colors">Airport Shuttle</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Contact Us</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-brand-primary" />
                                <span>Bole, Addis Ababa, Ethiopia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-primary" />
                                <div className="flex flex-col">
                                    <span>+251 911 520 275</span>
                                    <span>+251 921 929 159</span>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                                <a href="https://wa.me/251911520275" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                                    WhatsApp Us
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-brand-primary" />
                                <span>info@flowaddis.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Stay Updated</h3>
                        <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for exclusive offers.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-primary w-full transition-colors"
                            />
                            <button className="bg-brand-primary px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm">© 2025 Flowaddis. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-brand-secondary transition-colors"><Facebook className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-400 hover:text-brand-secondary transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-400 hover:text-brand-secondary transition-colors"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-400 hover:text-brand-secondary transition-colors"><Linkedin className="w-5 h-5" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
