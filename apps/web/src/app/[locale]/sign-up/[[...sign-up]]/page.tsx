import { SignUp } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** Only allow same-origin relative paths — never forward an absolute or
 * protocol-relative URL from a query param into a post-auth redirect. */
function safeRedirect(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectUrl = safeRedirect(redirect_url);
  const locale = await getLocale();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <SignUp
        path={`${prefix}/sign-up`}
        routing="path"
        signInUrl={`${prefix}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
