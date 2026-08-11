import { SignIn } from "@clerk/nextjs";

/** Only allow same-origin relative paths — never forward an absolute or
 * protocol-relative URL from a query param into a post-auth redirect. */
function safeRedirect(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const redirectUrl = safeRedirect(searchParams.redirect_url);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
