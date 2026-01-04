import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function HotelCardSkeleton() {
    return (
        <Card className="overflow-hidden border border-gray-200 bg-white h-full">
            <div className="h-48 relative">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-1 mb-2">
                    <Skeleton className="h-3 w-4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>

                <div className="mt-auto pt-2 flex items-end justify-between">
                    <div className="flex gap-1">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="text-right">
                        <Skeleton className="h-3 w-8 ml-auto mb-1" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
            </div>
        </Card>
    )
}
