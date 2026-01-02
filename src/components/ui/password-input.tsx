import * as React from "react"
import { Input, InputProps } from "./input"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)

        return (
            <Input
                type={showPassword ? "text" : "password"}
                className={className}
                ref={ref}
                {...props}
                suffix={
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                        </span>
                    </button>
                }
            />
        )
    }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
