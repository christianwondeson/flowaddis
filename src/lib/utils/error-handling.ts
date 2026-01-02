import { toast } from "sonner";

export const handleAuthError = (error: any) => {
    console.error("Auth Error:", error);

    let message = "An unexpected error occurred. Please try again.";

    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                message = "Invalid email or password. Please check your credentials.";
                break;
            case 'auth/email-already-in-use':
                message = "This email is already registered. Please sign in instead.";
                break;
            case 'auth/weak-password':
                message = "Password is too weak. Please use a stronger password.";
                break;
            case 'auth/invalid-email':
                message = "Please enter a valid email address.";
                break;
            case 'auth/too-many-requests':
                message = "Too many failed attempts. Please try again later.";
                break;
            case 'auth/network-request-failed':
                message = "Network error. Please check your internet connection.";
                break;
            default:
                message = error.message || message;
        }
    } else if (error.message) {
        message = error.message;
    }

    toast.error(message);
};
