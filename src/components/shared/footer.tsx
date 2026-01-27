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

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Services</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/flights" className="hover:text-brand-secondary transition-colors">Flights</Link></li>
                            <li><Link href="/hotels" className="hover:text-brand-secondary transition-colors">Hotels</Link></li>
                            <li><Link href="/conferences" className="hover:text-brand-secondary transition-colors">Conferences</Link></li>
                            <li><Link href="/shuttles" className="hover:text-brand-secondary transition-colors">Shuttles</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Company</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/about" className="hover:text-brand-secondary transition-colors">About Us</Link></li>
                            <li><Link href="/privacy" className="hover:text-brand-secondary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-brand-secondary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="hover:text-brand-secondary transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Support</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-brand-primary" />
                                <span>+251 921 929 159</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-brand-primary" />
                                <span>flowaddis@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <a href="https://wa.me/251921929159" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                                    WhatsApp
                                </a>
                            </li>
                            <li><Link href="/help" className="hover:text-brand-secondary transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Stay Updated</h3>
                        <p className="text-gray-400 text-sm mb-4">Subscribe for exclusive offers.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary w-full transition-colors"
                            />
                            <button className="bg-brand-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm">© 2025 BookAddis. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="https://facebook.com/bookaddis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-secondary transition-colors"><Facebook className="w-5 h-5" /></a>
                        <a href="https://twitter.com/bookaddis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-secondary transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="https://instagram.com/bookaddis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-secondary transition-colors"><Instagram className="w-5 h-5" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
