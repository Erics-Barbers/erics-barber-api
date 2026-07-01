import { renderBrandedEmail } from './email-layout';

export function renderVerificationEmail(verificationLink: string): string {
  return renderBrandedEmail({
    action: {
      href: verificationLink,
      label: 'Verify Email',
    },
    intro:
      "Confirm your email address to finish setting up your Eric's Barbers account.",
    preheader: "Verify your Eric's Barbers email address.",
    secondaryText:
      'The verification link is time-limited. If it expires, request a new email from the app.',
    title: 'Verify your email',
  });
}

export function renderPasswordResetEmail(resetLink: string): string {
  return renderBrandedEmail({
    action: {
      href: resetLink,
      label: 'Reset Password',
    },
    intro:
      "Use the secure link below to choose a new password for your Eric's Barbers account.",
    preheader: "Reset your Eric's Barbers password.",
    secondaryText:
      'If you did not request a password reset, you can ignore this email.',
    title: 'Reset your password',
  });
}

export function renderMfaCodeEmail(code: string): string {
  return renderBrandedEmail({
    details: [{ label: 'Login code', value: code }],
    intro: 'Use this code to finish logging in to your account.',
    preheader: "Your Eric's Barbers login code.",
    secondaryText: 'This code expires in 10 minutes.',
    title: 'Your login code',
  });
}
