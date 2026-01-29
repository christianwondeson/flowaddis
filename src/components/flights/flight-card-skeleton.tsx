import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function FlightCardSkeleton() {
    return (
        <Card className="overflow-hidden border-gray-100">
            <div className="flex flex-col md:flex-row">
                {/* Main Info */}
                <div className="flex-1 p-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        {/* Airline */}
                        <div className="flex items-center gap-4 w-full md:w-48">
                            <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center justify-between flex-1 w-full max-w-md mx-auto">
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-16" />
                                <Skeleton className="h-3 w-8" />
                            </div>

                            <div className="flex-1 px-4 flex flex-col items-center space-y-2">
                                <Skeleton className="h-2 w-12" />
                                <Skeleton className="h-[2px] w-full" />
                                <Skeleton className="h-2 w-16" />
                            </div>

                            <div className="space-y-2 text-right">
                                <Skeleton className="h-7 w-16 ml-auto" />
                                <Skeleton className="h-3 w-8 ml-auto" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Section */}
                <div className="md:w-56 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 p-5 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4">
                    <div className="space-y-2 text-center">
                        <Skeleton className="h-3 w-16 mx-auto" />
                        <Skeleton className="h-9 w-28 mx-auto" />
                        <Skeleton className="h-2 w-20 mx-auto" />
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-[140px] md:max-w-none">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                </div>
            </div>
        </Card>
    )
}
