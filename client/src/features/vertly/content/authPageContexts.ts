import { ROUTES } from "@/lib/routes"
import type { VertlyPageContext } from "@/features/vertly/types"

const BASE: Pick<VertlyPageContext, "suggestions" | "quickActions"> = {
  suggestions: [],
  quickActions: [],
}

function ctx(
  surface: VertlyPageContext["surface"],
  title: string,
  description: string,
  extras: Partial<VertlyPageContext> = {}
): VertlyPageContext {
  return { surface, title, description, ...BASE, ...extras }
}

export const LOGIN_VERTLY_CONTEXT = ctx("login", "Sign in", "Welcome back to Convertly", {
  suggestions: [
    { id: "login-what", label: "What does Convertly do?", prompt: "What does Convertly do?" },
    { id: "login-audit", label: "How do audits work?", prompt: "How do website audits work in Convertly?" },
    { id: "login-plans", label: "Pricing & plans", prompt: "What plans does Convertly offer?" },
    { id: "login-sample", label: "Sample report", prompt: "What is the sample report?" },
    { id: "login-signup", label: "How do I sign up?", prompt: "How do I sign up?" },
  ],
})

export const FORGOT_PASSWORD_VERTLY_CONTEXT = ctx(
  "forgot-password",
  "Forgot password",
  "Recover access to your account",
  {
    suggestions: [
      {
        id: "forgot-help",
        label: "How does reset work?",
        prompt: "How does password reset work in Convertly?",
      },
      {
        id: "forgot-strong",
        label: "Password tips",
        prompt: "What makes a strong password for my Convertly account?",
      },
      {
        id: "forgot-login",
        label: "How do I sign in?",
        prompt: "How do I sign in?",
      },
      {
        id: "forgot-safe",
        label: "Is my data safe?",
        prompt: "Is my data safe?",
      },
    ],
  }
)

export const RESET_PASSWORD_VERTLY_CONTEXT = ctx(
  "reset-password",
  "Reset password",
  "Choose a secure new password",
  {
    suggestions: [
      {
        id: "reset-strong",
        label: "Password tips",
        prompt: "What makes a strong password for my Convertly account?",
      },
      {
        id: "reset-help",
        label: "How does reset work?",
        prompt: "How does password reset work in Convertly?",
      },
      {
        id: "reset-login",
        label: "How do I sign in?",
        prompt: "How do I sign in?",
      },
      {
        id: "reset-safe",
        label: "Is my data safe?",
        prompt: "Is my data safe?",
      },
    ],
  }
)

export const AUTH_VERTLY_GREETINGS: Partial<Record<string, string>> = {
  [ROUTES.login]: "Welcome back! Ready to improve your website?",
  [ROUTES.signup]: "Let's build something great together.",
  [ROUTES.forgotPassword]: "No worries. I'll help you get back into your account.",
  [ROUTES.resetPassword]: "You're almost done. Choose a strong new password.",
}

export function resolveGuestAuthContext(pathname: string): VertlyPageContext {
  if (pathname === ROUTES.login) return LOGIN_VERTLY_CONTEXT
  if (pathname === ROUTES.forgotPassword) return FORGOT_PASSWORD_VERTLY_CONTEXT
  if (pathname === ROUTES.resetPassword) return RESET_PASSWORD_VERTLY_CONTEXT
  return LOGIN_VERTLY_CONTEXT
}
