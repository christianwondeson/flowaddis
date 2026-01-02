import React, { Suspense } from 'react';
import { HotelsMapContent } from '@/components/hotels/hotels-map-content';

export const dynamic = 'force-dynamic';

export default function HotelsMapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <HotelsMapContent />
    </Suspense>
  );
}
