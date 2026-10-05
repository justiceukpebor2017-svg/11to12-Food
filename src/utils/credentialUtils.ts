// Credential & Default Password Generator for 11 to 12 Desk Drop

/**
 * Generates a clean, readable default password for new or existing subscribers.
 * E.g. DeskDrop#842, ElevenToTwelve@519, HotLunch!347
 */
export function generateDefaultPassword(): string {
  const words = ['DeskDrop', 'ElevenToTwelve', 'HotLunch', 'LagosChow', 'OfficeMeal', 'FreshFood', 'JollofTime'];
  const symbols = ['#', '!', '@', '$'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${randomWord}${randomSymbol}${randomNum}`;
}

export interface CredentialMessageParams {
  customerName: string;
  email: string;
  defaultPassword: string;
  totalDays: number;
  company?: string;
}

/**
 * Formats a ready-to-send WhatsApp notification with the subscriber's login credentials.
 */
export function formatCredentialWhatsAppMessage({
  customerName,
  email,
  defaultPassword,
  totalDays,
  company,
}: CredentialMessageParams): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food';
  const companyStr = company ? ` at ${company}` : '';

  return `Hello ${customerName}! 🎉

Your 11 to 12 Desk Drop lunch subscription (${totalDays} workdays)${companyStr} has been officially confirmed by 11 to 12.

Here are your default login details to access your Lunch Dashboard:
🌐 Website: ${appOrigin}
📧 Login Email: ${email}
🔑 Default Password: ${defaultPassword}

How to log in:
1. Open ${appOrigin} and click "Log In" in the top corner.
2. Enter your email and default password.
3. You will be prompted to set your personal permanent password on your first login.

Your piping-hot desk drop lunches will arrive promptly between 11 AM - 12 PM! 🍲`;
}

/**
 * Formats an email template with login credentials.
 */
export function formatCredentialEmailMessage({
  customerName,
  email,
  defaultPassword,
  totalDays,
  company,
}: CredentialMessageParams): { subject: string; body: string } {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://11to12.food';
  const companyStr = company ? ` (${company})` : '';

  return {
    subject: `Your 11 to 12 Login Details • ${totalDays} Workday Lunch Plan`,
    body: `Hello ${customerName},

Welcome to 11 to 12 Desk Drop${companyStr}! Your ${totalDays} workday corporate lunch subscription is active.

Here are your account credentials:
Website: ${appOrigin}
Email: ${email}
Default Password: ${defaultPassword}

Next Steps:
1. Visit ${appOrigin} and click "Log In" at the top right.
2. Log in with your email and the default password above.
3. You will be prompted to create your personal permanent password to secure your dashboard.

If you have any questions or meal preference updates, you can contact the 11 to 12 team directly on WhatsApp (08026180680).

Warm regards,
The 11 to 12 Team`,
  };
}
