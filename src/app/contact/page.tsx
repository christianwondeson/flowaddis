import type { Metadata } from "next";
import { ContactPageContent } from "@/components/contact/contact-page-content";

export const metadata: Metadata = {
    title: "Contact Us | BookAddis",
    description: "Get in touch with BookAddis for support, inquiries, or feedback.",
};

export default function ContactPage() {
    return <ContactPageContent />;
}
