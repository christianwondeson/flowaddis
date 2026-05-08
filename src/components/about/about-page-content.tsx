"use client";

import React from "react";
import { Target, Heart, Sparkles } from "lucide-react";
import { useTranslations } from "@/components/providers/locale-provider";

export function AboutPageContent() {
    const { t } = useTranslations();

    return (
        <div className="min-h-screen bg-brand-gray/30 pt-16 md:pt-20">
            <section className="relative bg-teal-600 text-white py-6 md:py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("about.heroTitle")}</h1>
                        <p className="text-teal-100 text-base md:text-lg">{t("about.heroSubtitle")}</p>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4">{t("about.missionTitle")}</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">{t("about.missionBody")}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Target className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">{t("about.excellenceTitle")}</h3>
                                <p className="text-gray-600">{t("about.excellenceBody")}</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Heart className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">{t("about.customerFirstTitle")}</h3>
                                <p className="text-gray-600">{t("about.customerFirstBody")}</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4">
                                    <Sparkles className="w-7 h-7 text-brand-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">{t("about.innovationTitle")}</h3>
                                <p className="text-gray-600">{t("about.innovationBody")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-6 text-center">{t("about.storyTitle")}</h2>
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <p className="mb-6">{t("about.storyP1")}</p>
                            <p className="mb-6">{t("about.storyP2")}</p>
                            <p>{t("about.storyP3")}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16 bg-brand-dark text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">1000+</div>
                            <div className="text-gray-400">{t("about.statHotels")}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">50+</div>
                            <div className="text-gray-400">{t("about.statDestinations")}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">10K+</div>
                            <div className="text-gray-400">{t("about.statCustomers")}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-brand-secondary mb-2">24/7</div>
                            <div className="text-gray-400">{t("about.statSupport")}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4">{t("about.ctaTitle")}</h2>
                        <p className="text-lg text-gray-600 mb-8">{t("about.ctaSubtitle")}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/hotels"
                                className="bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                            >
                                {t("about.browseHotels")}
                            </a>
                            <a
                                href="/contact"
                                className="bg-white text-brand-primary border-2 border-brand-primary px-8 py-4 rounded-xl font-bold hover:bg-brand-primary hover:text-white transition-colors"
                            >
                                {t("footer.contactUs")}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
