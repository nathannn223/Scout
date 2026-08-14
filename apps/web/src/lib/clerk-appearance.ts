// Clerk renders its own UI (SignIn, SignUp, UserButton menu...) with a light
// default theme unless told otherwise — never themed until now, which meant
// every auth surface clashed hard with the rest of the dark, orange-accented
// design system. Values below are the hex equivalents of the HSL tokens in
// globals.css (:root), kept in sync manually since Clerk's `variables` API
// takes hex/rgb, not our CSS custom properties.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#ff4a26", // --primary: 10 100% 57%
    colorBackground: "#121316", // --background: 225 10% 8%
    colorInputBackground: "#1c1d21", // --card: 228 8% 12%
    colorInputText: "#f2f1ee", // --foreground: 45 13% 94%
    colorText: "#f2f1ee",
    colorTextSecondary: "#908f94", // --muted-foreground: 252 2% 57%
    colorNeutral: "#f2f1ee",
    colorDanger: "#f87272", // --destructive: 0 91% 71%
    borderRadius: "1rem", // --radius
    fontFamily: "var(--font-sans)",
  },
  elements: {
    card: "shadow-none border border-border",
    footerActionLink: "text-primary hover:opacity-80",
  },
};
