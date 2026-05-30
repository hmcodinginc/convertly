/**
 * Future Convertly email branding constants.
 * Use these when replacing Supabase default email templates with HM Coding / Convertly branding.
 */
export const EMAIL_BRANDING = {
  company: {
    name: "HM Coding",
    legalName: "HM Coding",
    websiteUrl: "https://hmcoding.com",
    supportEmail: "support@convertly.app",
  },
  product: {
    name: "Convertly",
    tagline: "AI Conversion Intelligence",
    appUrl: "https://convertly.app",
    logoAlt: "Convertly logo",
  },
  colors: {
    background: "#090b10",
    surface: "#11141b",
    foreground: "#e6e9ef",
    muted: "#94a3b8",
    accent: "#7c6cff",
    accentGradient:
      "linear-gradient(135deg, #7c6cff 0%, #5d7dff 48%, #35b3ff 100%)",
    border: "rgba(148, 163, 184, 0.22)",
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  footer: {
    copyright: "© HM Coding. All rights reserved.",
    addressLine: "Convertly by HM Coding",
  },
  templates: {
    signupConfirmation: {
      subject: "Confirm your Convertly account",
      previewText: "Verify your email to start improving conversion performance.",
    },
    passwordReset: {
      subject: "Reset your Convertly password",
      previewText: "Use this link to securely reset your Convertly password.",
    },
    magicLink: {
      subject: "Sign in to Convertly",
      previewText: "Your secure sign-in link for Convertly.",
    },
  },
} as const

export type EmailBranding = typeof EMAIL_BRANDING
