import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function FlightCardSkeleton() {
    return (
        <Card className="p-4 md:p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                {/* Airline Info */}
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-1/4">
                    <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                    </div>
                </div>

                {/* Flight Route */}
                <div className="flex items-center gap-4 md:gap-8 w-full md:w-2/4 justify-between md:justify-center">
                    <div className="text-center flex-1 space-y-2">
                        <Skeleton className="h-6 w-16 mx-auto" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                    </div>

                    <div className="flex flex-col items-center w-full max-w-[100px] md:max-w-[150px] space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-[2px] w-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>

                    <div className="text-center flex-1 space-y-2">
                        <Skeleton className="h-6 w-16 mx-auto" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 md:gap-2 w-full md:w-1/4 md:pl-6 pt-4 md:pt-0">
                    <div className="text-left md:text-right space-y-1">
                        <Skeleton className="h-8 w-24 ml-auto" />
                        <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                    <div className="flex items-center gap-2 w-auto md:w-full">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                    </div>
                </div>
            </div>
        </Card>
    )
}
