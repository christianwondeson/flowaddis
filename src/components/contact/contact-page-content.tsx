"use client";

import React from "react";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOKADDIS_ETHIOPIA_PHONE, BOOKADDIS_INTERNATIONAL_LINES } from "@/lib/contact-phones";
import { useTranslations } from "@/components/providers/locale-provider";

export function ContactPageContent() {
    const { t } = useTranslations();

    return (
        <div className="min-h-screen bg-brand-gray/30 pt-16 md:pt-20">
            <section className="bg-teal-600 text-white py-6 md:py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("contact.heroTitle")}</h1>
                        <p className="text-teal-100 text-base md:text-lg">{t("contact.heroSubtitle")}</p>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <h2 className="text-3xl font-bold text-brand-dark mb-8">{t("contact.getInTouch")}</h2>
                                <p className="text-gray-600 mb-8">{t("contact.intro")}</p>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Phone className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-bold text-brand-dark mb-2">{t("contact.phone")}</h3>
                                                <p className="text-sm text-gray-500 mb-3">{t("contact.phoneHours")}</p>
                                            </div>
                                            <div className="space-y-3 text-gray-600">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                                                        {t("footer.ethiopia")}
                                                    </p>
                                                    <a
                                                        href={`tel:${BOOKADDIS_ETHIOPIA_PHONE.tel}`}
                                                        className="font-medium text-brand-primary hover:underline"
                                                    >
                                                        {BOOKADDIS_ETHIOPIA_PHONE.display}
                                                    </a>
                                                </div>
                                                {BOOKADDIS_INTERNATIONAL_LINES.map((line) => (
                                                    <div key={line.region}>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                                                            {line.region}
                                                        </p>
                                                        <a
                                                            href={`tel:${line.tel}`}
                                                            className="font-medium text-brand-primary hover:underline"
                                                        >
                                                            {line.display}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Mail className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <p className="text-gray-600 font-medium">{t("contact.emailUs")}</p>
                                            <a
                                                href="mailto:info@bookaddis.com"
                                                className="text-brand-primary font-medium hover:underline"
                                            >
                                                info@bookaddis.com
                                            </a>
                                            <p className="text-sm text-gray-500">{t("contact.respond24h")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                                            <MessageCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">{t("contact.whatsAppTitle")}</h3>
                                            <a
                                                href="https://wa.me/251911520275"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-700 transition-colors"
                                            >
                                                {t("contact.whatsAppChat")}
                                            </a>
                                            <p className="text-sm text-gray-500">{t("contact.whatsAppInstant")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-6 h-6 text-brand-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark mb-1">{t("contact.officeTitle")}</h3>
                                            <p className="text-gray-600">{t("contact.officeLocation")}</p>
                                            <p className="text-sm text-gray-500">{t("contact.officeAppointment")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-xl">
                                <h3 className="text-2xl font-bold text-brand-dark mb-6">{t("contact.formTitle")}</h3>
                                <form className="space-y-6">
                                    <div>
                                        <Input label={t("contact.fullName")} placeholder={t("contact.fullNamePlaceholder")} required />
                                    </div>

                                    <div>
                                        <Input
                                            label={t("common.email")}
                                            type="email"
                                            placeholder={t("contact.emailPlaceholder")}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label={t("contact.phoneOptional")}
                                            type="tel"
                                            placeholder={t("contact.phonePlaceholder")}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("contact.subject")}</label>
                                        <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent">
                                            <option>{t("contact.subjectGeneral")}</option>
                                            <option>{t("contact.subjectBooking")}</option>
                                            <option>{t("contact.subjectPartnership")}</option>
                                            <option>{t("contact.subjectFeedback")}</option>
                                            <option>{t("contact.subjectOther")}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("contact.message")}</label>
                                        <textarea
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                            placeholder={t("contact.messagePlaceholder")}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full">
                                        <Send className="w-4 h-4 mr-2" />
                                        {t("contact.sendMessage")}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-16 bg-white pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-brand-dark mb-8 text-center">{t("contact.faqTitle")}</h2>
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">{t("contact.faq1q")}</h3>
                                <p className="text-gray-600">{t("contact.faq1a")}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">{t("contact.faq2q")}</h3>
                                <p className="text-gray-600">{t("contact.faq2a")}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="font-bold text-brand-dark mb-2">{t("contact.faq3q")}</h3>
                                <p className="text-gray-600">{t("contact.faq3a")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
