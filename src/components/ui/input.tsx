import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    suffix?: React.ReactNode;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, icon, suffix, error, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            className,
                            icon && "!pl-11",
                            suffix && "!pr-11",
                            error && "border-red-500 focus-visible:ring-red-500",
                        )}
                        ref={ref}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute right-0 top-0 h-full flex items-center justify-center px-3.5 text-slate-400 z-10">
                            {suffix}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }

