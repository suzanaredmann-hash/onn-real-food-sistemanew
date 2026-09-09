import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="onn-card w-full max-w-sm p-8">
        <span className="mb-4 inline-block rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-[#14162e]">
          ONN
        </span>
        <h1 className="mb-1 text-lg font-semibold text-[#14162e]">
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
