import React from 'react';
import { Metadata } from 'next';
import { MapPin, Users, Award, Target, Heart, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About Us | BookAddis',
    description: 'Learn about BookAddis - Your premium gateway to Ethiopia for flights, hotels, conferences, and transportation.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-brand-gray/30 pt-16 md:pt-20">
            {/* Hero Section */}
            <section className="relative bg-teal-600 text-white py-6 md:py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            About BookAddis
                        </h1>
                        <p className="text-teal-100 text-base md:text-lg">
                            Your Premium Gateway to Ethiopia
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-10 md:py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4">Our Mission</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                FlowAddis is dedicated to making travel and event planning in Ethiopia seamless,
                                accessible, and enjoyable. We connect travelers and businesses with the best
                                accommodations, flights, conference venues, and transportation services across Ethiopia.
                            </p>
                        </div>

                        {/* Values Grid */}
                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Target className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">Excellence</h3>
                                <p className="text-gray-600">
                                    We strive for excellence in every booking, ensuring premium quality and service.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Heart className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">Customer First</h3>
                                <p className="text-gray-600">
                                    Your satisfaction is our priority. We're here to make your journey smooth.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Sparkles className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">Innovation</h3>
                                <p className="text-gray-600">
                                    Leveraging technology to provide the best booking experience in Ethiopia.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-10 md:py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-6 text-center">Our Story</h2>
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <p className="mb-6">
                                FlowAddis was born from a vision to transform how people experience Ethiopia.
                                Whether you're a business traveler attending conferences, a tourist exploring
                                our rich cultural heritage, or a local looking for the perfect getaway, we're
                                here to make it happen.
                            </p>
                            <p className="mb-6">
                                We understand the unique needs of travelers in Ethiopia and have built a platform
                                that combines international standards with local expertise. Our team works tirelessly
                                to partner with the best hotels, airlines, conference venues, and transportation
                                providers to bring you unmatched value and convenience.
                            </p>
                            <p>
                                Today, BookAddis serves thousands of customers, helping them discover Ethiopia's
                                beauty, conduct successful business events, and create unforgettable memories.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-10 md:py-16 bg-brand-dark text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">1000+</div>
                            <div className="text-gray-400">Hotels</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">50+</div>
                            <div className="text-gray-400">Destinations</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">10K+</div>
                            <div className="text-gray-400">Happy Customers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">24/7</div>
                            <div className="text-gray-400">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-10 md:py-16 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4">
                            Ready to Experience Ethiopia?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Start planning your perfect trip with BookAddis today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/hotels"
                                className="bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                            >
                                Browse Hotels
                            </a>
                            <a
                                href="/contact"
                                className="bg-white text-brand-primary border-2 border-brand-primary px-8 py-4 rounded-xl font-bold hover:bg-brand-primary hover:text-white transition-colors"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
