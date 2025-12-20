import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export class ResendService {
  constructor() {}

  async sendEmail(to: string, subject: string, html: string) {
    return await resend.emails.send({
      from: 'no-reply@mail.erics-barbers-luton.co.uk',
      to,
      subject,
      html,
    });
  }
}
