import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-6 md:mb-8', className)}>
      <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-1 md:mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 text-sm md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
