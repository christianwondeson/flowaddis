import React, { Suspense } from 'react';
import { HotelsMapContent } from '@/components/hotels/hotels-map-content';
import { Preloader } from '@/components/ui/preloader';

export const dynamic = 'force-dynamic';

export default function HotelsMapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Preloader size="lg" /></div>}>
      <HotelsMapContent />
    </Suspense>
  );
}
