import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover = false, children, ...props }) => {
    return (
        <div
            className={cn(
                'rounded-xl shadow-sm border border-border bg-card text-card-foreground overflow-hidden',
                hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
