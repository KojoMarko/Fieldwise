
import * as React from 'react';

export interface EmailTemplateProps {
  name: string;
  email: string;
  tempPassword?: string;
}

const baseUrl = 'https://fieldwise-nine.vercel.app';

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  email,
  tempPassword,
}) => {
    const loginUrl = new URL(`${baseUrl}/login`);
    loginUrl.searchParams.set('email', email);
    if (tempPassword) {
        loginUrl.searchParams.set('password', tempPassword);
    }
  
    return (
  <html lang="en">
    <head>
        <style dangerouslySetInnerHTML={{ __html: `
            body { background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif; }
            .container { background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; border: 1px solid #e6ebf1; border-radius: 8px; }
            .heading { color: #333; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; }
            .paragraph { color: #555; font-size: 16px; line-height: 26px; padding: 0 20px; }
            .credential-text { color: #555; font-size: 16px; line-height: 26px; padding: 0 20px; margin: 10px 0; }
            .button { background-color: #3498DB; border-radius: 3px; color: #fff; font-size: 16px; text-decoration: none; text-align: center; display: block; width: 200px; padding: 12px; margin: 20px auto; }
            .footer { color: #8898aa; font-size: 12px; line-height: 16px; text-align: center; }
        `}} />
    </head>
    <body>
      <div className="container">
        <img
          src={`${baseUrl}/Field%20Wise%20Logo.png`}
          width="48"
          height="48"
          alt="FieldWise"
          style={{ margin: '0 auto', display: 'block' }}
        />
        <h1 className="heading">Welcome to FieldWise, {name}!</h1>
        <p className="paragraph">
          Your account has been created and is ready to use. Here are your
          login credentials:
        </p>
        <p className="credential-text">
          <strong>Email:</strong> {email}
        </p>
        {tempPassword && (
          <p className="credential-text">
            <strong>Temporary Password:</strong> {tempPassword}
          </p>
        )}
        <p className="paragraph">
          For security reasons, you will be required to change this password
          upon your first login.
        </p>
        <a href={loginUrl.toString()} className="button">
          Login to Your Account
        </a>
        <p className="footer">
          FieldWise | Enterprise-grade field service management
        </p>
      </div>
    </body>
  </html>
)};

export default EmailTemplate;
