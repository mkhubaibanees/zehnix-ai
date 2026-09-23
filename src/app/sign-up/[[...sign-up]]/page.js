import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        // Center the sign-up component vertically and horizontally
        <div className="flex items-center justify-center min-h-screen bg-[#131314]">
            <SignUp />
        </div>
    );
}