import { PasswordRecoveryForm } from "@/components/auth/PasswordRecoveryForm";
export const metadata = { title: "Forgot password | E-LearningLKA", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function ForgotPasswordPage() { return <PasswordRecoveryForm />; }
