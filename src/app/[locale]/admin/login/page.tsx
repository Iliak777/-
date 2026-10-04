import { pageI18n } from "@/i18n/server";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage({ params }: PageProps<"/[locale]/admin/login">) {
  const { dict } = await pageI18n(params);
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Logo />
      <h1 className="mt-6 font-display text-3xl font-medium">{dict.admin.title}</h1>
      <LoginForm />
    </main>
  );
}
