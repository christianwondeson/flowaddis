"use client";

import React from 'react';
import { Star, User, MessageSquare } from 'lucide-react';

interface Review {
    review_id: number;
    title: string;
    pros: string;
    cons: string;
    average_score: number;
    date: string;
    author: {
        name: string;
        avatar?: string;
        countrycode: string;
        type_string: string;
    };
}

interface HotelDetailReviewsProps {
    reviews: Review[];
    loading?: boolean;
}

export const HotelDetailReviews: React.FC<HotelDetailReviewsProps> = ({ reviews, loading = false }) => {
    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-4 p-6 border border-border rounded-2xl">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-5/6" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/40 dark:bg-slate-800/40 rounded-2xl border border-dashed border-border">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to share your experience!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.review_id} className="p-6 border border-border rounded-2xl hover:border-brand-primary/20 hover:shadow-sm transition-all duration-300 bg-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            {review.author.avatar ? (
                                <img src={review.author.avatar} alt={review.author.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-primary/10" />
                            ) : (
                                <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center font-bold text-lg">
                                    {review.author.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h4 className="font-bold text-foreground">{review.author.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{review.author.countrycode.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>{review.author.type_string}</span>
                                    <span>•</span>
                                    <span>{new Date(review.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-brand-primary text-white px-2 py-1 rounded-lg font-bold text-sm">
                            <Star className="w-3 h-3 fill-current" />
                            {review.average_score.toFixed(1)}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h5 className="font-bold text-foreground text-sm">{review.title}</h5>
                        {review.pros && (
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                <span className="font-bold text-green-600 mr-2">Pros:</span>
                                {review.pros}
                            </div>
                        )}
                        {review.cons && (
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                <span className="font-bold text-red-600 dark:text-red-400 mr-2">Cons:</span>
                                {review.cons}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
