import React from "react";
import { Metadata } from "next";
import { AboutPageContent } from "@/components/about/about-page-content";

export const metadata: Metadata = {
    title: "About Us | BookAddis",
    description:
        "Learn about BookAddis - Your premium gateway to Ethiopia for flights, hotels, conferences, and transportation.",
};

export default function AboutPage() {
    return <AboutPageContent />;
}
