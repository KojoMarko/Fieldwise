
'use server';
import { Resend } from 'resend';
import { EmailTemplate, EmailTemplateProps } from './email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    email: string, 
    subject: string, 
    name: string,
    tempPassword?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FieldWise <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      react: EmailTemplate({ 
        name: name,
        email: email,
        tempPassword: tempPassword,
       } as EmailTemplateProps),
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email.');
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
