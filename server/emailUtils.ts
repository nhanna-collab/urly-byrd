import crypto from 'crypto';

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendVerificationEmail(email: string, code: string, businessName: string): Promise<void> {
  // For now, log to console (like SMS)
  // Later, this can be upgraded to use Resend, SendGrid, etc.
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL VERIFICATION CODE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${email}`);
  console.log(`Business: ${businessName}`);
  console.log(`\nYour Urly Byrd verification code is: ${code}`);
  console.log('\nThis code will expire in 15 minutes.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // TODO: When email service is configured, send actual email here
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'Urly Byrd <noreply@urlybyrd.com>',
  //   to: email,
  //   subject: 'Verify your Urly Byrd account',
  //   html: `
  //     <h2>Welcome to Urly Byrd!</h2>
  //     <p>Your verification code is: <strong>${code}</strong></p>
  //     <p>This code will expire in 15 minutes.</p>
  //   `
  // });
}

export function isVerificationCodeExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}
