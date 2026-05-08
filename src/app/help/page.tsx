"use client";

import React, { useMemo, useState } from "react";
import { Send, ShieldAlert, Ticket, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateSupportTicketInput, SupportServiceType, SupportTicketCategory } from "@/types/support";
import { BOOKADDIS_ETHIOPIA_PHONE, BOOKADDIS_INTERNATIONAL_LINES } from "@/lib/contact-phones";
import { useTranslations } from "@/components/providers/locale-provider";

const SERVICE_ORDER: { value: SupportServiceType; msg: string }[] = [
    { value: "hotels", msg: "help.services.hotels" },
    { value: "flights", msg: "help.services.flights" },
    { value: "conferences", msg: "help.services.conferences" },
    { value: "shuttles", msg: "help.services.shuttles" },
    { value: "other", msg: "help.services.other" },
];

const CATEGORY_ORDER: { value: SupportTicketCategory; msg: string }[] = [
    { value: "booking_issue", msg: "help.categories.booking_issue" },
    { value: "duplicate_transaction", msg: "help.categories.duplicate_transaction" },
    { value: "payment_dispute", msg: "help.categories.payment_dispute" },
    { value: "refund_request", msg: "help.categories.refund_request" },
    { value: "technical_issue", msg: "help.categories.technical_issue" },
    { value: "other", msg: "help.categories.other" },
];

export default function HelpPage() {
    const { t } = useTranslations();
    const [submitting, setSubmitting] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<CreateSupportTicketInput>({
        name: "",
        email: "",
        phone: "",
        service: "hotels",
        category: "booking_issue",
        priority: "medium",
        bookingId: "",
        transactionId: "",
        subject: "",
        message: "",
    });

    const canSubmit = useMemo(() => {
        return Boolean(form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim());
    }, [form]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        setSuccessId(null);

        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    phone: form.phone?.trim() || undefined,
                    bookingId: form.bookingId?.trim() || undefined,
                    transactionId: form.transactionId?.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || t("help.ticketSubmitError"));

            setSuccessId(data?.item?.id || "Created");
            setForm((prev) => ({
                ...prev,
                bookingId: "",
                transactionId: "",
                subject: "",
                message: "",
            }));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t("help.genericError"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray/30 pt-16 md:pt-20">
            <section className="bg-brand-primary text-white py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold">{t("help.title")}</h1>
                        <p className="text-white/90 mt-2">{t("help.subtitle")}</p>
                    </div>
                </div>
            </section>

            <section className="py-10 md:py-14">
                <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-xl font-extrabold text-brand-dark flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-brand-primary" />
                                {t("help.contactSupport")}
                            </h2>
                            <p className="text-sm text-gray-600 mt-2">{t("help.contactSupportHint")}</p>

                            <div className="mt-6 space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                                    <div className="space-y-3">
                                        <div className="font-semibold text-brand-dark">{t("help.phoneLabel")}</div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                                                {t("footer.ethiopia")}
                                            </div>
                                            <a className="text-gray-700 hover:text-brand-primary" href={`tel:${BOOKADDIS_ETHIOPIA_PHONE.tel}`}>
                                                {BOOKADDIS_ETHIOPIA_PHONE.display}
                                            </a>
                                        </div>
                                        {BOOKADDIS_INTERNATIONAL_LINES.map((line) => (
                                            <div key={line.region}>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">{line.region}</div>
                                                <a className="text-gray-700 hover:text-brand-primary" href={`tel:${line.tel}`}>
                                                    {line.display}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 text-brand-primary mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-brand-dark">{t("help.emailLabel")}</div>
                                        <a href="mailto:info@bookaddis.com" className="text-brand-primary hover:underline">
                                            info@bookaddis.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MessageCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-brand-dark">{t("help.whatsAppLabel")}</div>
                                        <a className="text-green-700 hover:text-green-800" href="https://wa.me/251921929159" target="_blank" rel="noreferrer">
                                            {t("help.chatWithUs")}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-xl font-extrabold text-brand-dark">{t("help.createTicket")}</h2>
                            <p className="text-sm text-gray-600 mt-1">{t("help.createTicketHint")}</p>

                            <form onSubmit={submit} className="mt-6 space-y-5">
                                {successId && (
                                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                        {t("help.ticketSuccess", { id: String(successId) })}
                                    </div>
                                )}
                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label={t("help.fullName")}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label={t("help.emailLabel")}
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label={t("help.phoneOptional")}
                                        value={form.phone || ""}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t("help.service")}</label>
                                        <select
                                            value={form.service}
                                            onChange={(e) => setForm({ ...form, service: e.target.value as SupportServiceType })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                                        >
                                            {SERVICE_ORDER.map((s) => (
                                                <option key={s.value} value={s.value}>
                                                    {t(s.msg)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t("help.issueType")}</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value as SupportTicketCategory })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                                        >
                                            {CATEGORY_ORDER.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {t(c.msg)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label={t("help.bookingIdOptional")}
                                        value={form.bookingId || ""}
                                        onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                                        placeholder={t("help.bookingIdPlaceholder")}
                                    />
                                    <Input
                                        label={t("help.transactionIdOptional")}
                                        value={form.transactionId || ""}
                                        onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                                        placeholder={t("help.transactionIdPlaceholder")}
                                    />
                                </div>

                                <Input
                                    label={t("help.subject")}
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("help.message")}</label>
                                    <textarea
                                        rows={6}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                        placeholder={t("help.messagePlaceholder")}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white gap-2" disabled={!canSubmit || submitting}>
                                        <Send className="w-4 h-4" />
                                        {submitting ? t("help.submitting") : t("help.submitTicket")}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
