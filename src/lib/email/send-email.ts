
'use server';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { EmailTemplate, EmailTemplateProps } from './email-template';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
    email: string, 
    subject: string, 
    name: string,
    tempPassword?: string
) {
  try {
    const emailHtml = render(EmailTemplate({ 
        name: name,
        email: email,
        tempPassword: tempPassword,
       } as EmailTemplateProps));

    const options = {
      from: '"FieldWise" <onboarding@fieldwise.com>',
      to: email,
      subject: subject,
      html: emailHtml,
    };

    const data = await transporter.sendMail(options);

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email.');
  }
}
