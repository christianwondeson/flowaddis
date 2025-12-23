"use client";

import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface HotelFAQProps {
    location: string;
}

export const HotelFAQ: React.FC<HotelFAQProps> = ({ location }) => {
    const faqs = [
        {
            question: `What are the best hotels in ${location}?`,
            answer: `Some of the top-rated hotels in ${location} include luxury options with world-class amenities, central locations, and excellent guest reviews. Popular choices often feature spas, fine dining, and business facilities.`
        },
        {
            question: `How much does a hotel in ${location} cost?`,
            answer: `Hotel prices in ${location} vary depending on the season, location, and star rating. On average, budget hotels start from $50 per night, while luxury 5-star hotels can range from $200 to over $500 per night.`
        },
        {
            question: `Which hotels in ${location} are good for families?`,
            answer: `Many hotels in ${location} offer family-friendly amenities such as larger rooms, swimming pools, and kids' clubs. Look for properties with "Family Room" options and high ratings for "Family Stay".`
        },
        {
            question: `Which hotels in ${location} have the best views?`,
            answer: `Hotels located in the city center or near major landmarks often provide stunning views of the skyline or natural surroundings. We recommend checking guest photos and reviews specifically mentioning "view".`
        }
    ];

    return (
        <section className="py-12 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs about hotels in {location}</h2>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-100">
                        <AccordionTrigger className="text-sm font-bold text-gray-900 hover:no-underline py-4">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 leading-relaxed pb-4">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
};
