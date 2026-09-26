// src/app/login/page.tsx
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back to StockSense"
      subtitle="Sign in to monitor receipts, delivery orders, and live inventory movements."
    >
      <LoginForm />
    </AuthLayout>
  );
}