import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        // Center the sign-in component vertically and horizontally
        <div className="flex items-center justify-center min-h-screen bg-[#131314]">
            <SignIn />
        </div>
    );
}