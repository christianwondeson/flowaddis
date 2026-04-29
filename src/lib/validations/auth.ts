import { z } from "zod";
import { validatePasswordStrength } from "@/lib/password-policy";

export const signInSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export const signUpSchema = z
    .object({
        name: z.string().min(2, { message: "Name must be at least 2 characters" }),
        email: z.string().email({ message: "Please enter a valid email address" }),
        password: z.string().min(1, { message: "Password is required" }),
        requestAdmin: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
        const r = validatePasswordStrength(data.password);
        if (!r.ok) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message, path: ["password"] });
        }
    });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
