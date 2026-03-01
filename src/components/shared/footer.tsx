import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-brand-dark text-white pt-20 pb-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6 lg:col-span-2">
                        <Logo light={true} />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your premium gateway to Ethiopia. Experience seamless booking for flights, hotels, conferences, and transportation.
                        </p>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Company</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact Us</Link></li>
                            <li><Link href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
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
                                <span>bookaddiso@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <a href="https://wa.me/251921929159" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                                    WhatsApp
                                </a>
                            </li>
                            <li><Link href="/help" className="hover:text-teal-400 transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    {/* Destinations */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Destinations</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/hotels?query=Addis Ababa" className="hover:text-teal-400 transition-colors">Addis Ababa</Link></li>
                            <li><Link href="/hotels?query=Bahir Dar" className="hover:text-teal-400 transition-colors">Bahir Dar</Link></li>
                            <li><Link href="/hotels?query=Lalibela" className="hover:text-teal-400 transition-colors">Lalibela</Link></li>
                            <li><Link href="/flights" className="hover:text-teal-400 transition-colors">Flights</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Follow Us</h3>
                        <div className="flex gap-3 mb-6">
                            <a href="https://facebook.com/bookaddis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-400 transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="https://instagram.com/bookaddis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-400 transition-colors"><Instagram className="w-5 h-5" /></a>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary w-full transition-colors"
                            />
                            <button className="bg-teal-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 text-white transition-colors shrink-0">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <p className="text-gray-500 text-sm">© 2025 BookAddis. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="text-gray-500 hover:text-teal-400 text-sm transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="text-gray-500 hover:text-teal-400 text-sm transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
