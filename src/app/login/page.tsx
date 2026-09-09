import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-zinc-900">
          ONN Real Food
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Entre com sua conta pra acessar o sistema.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
