
import * as React from 'react';

export interface EmailTemplateProps {
  name: string;
  email: string;
  tempPassword?: string;
}

const baseUrl = 'https://fieldwise-nine.vercel.app';

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
};

const box = {
  padding: '0 48px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const paragraph = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
};

const credentialText = {
  ...paragraph,
  padding: '0 20px',
  margin: '10px 0',
};


const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3498DB',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};


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
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
       <style>{`
            body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
       `}</style>
    </head>
    <body style={main}>
        {/* Preheader text for inbox preview */}
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
            Your FieldWise account is ready. Here are your login details.
        </div>
      <table role="presentation" border={0} cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
          <tbody>
              <tr>
                  <td>
                    <div style={container}>
                        <table role="presentation" border={0} cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                            <tbody>
                                <tr>
                                    <td align="center" style={{padding: '20px 0'}}>
                                         <img
                                            src={`${baseUrl}/Field%20Wise%20Logo.png`}
                                            width="48"
                                            height="48"
                                            alt="FieldWise"
                                            style={logo}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style={box}>
                                            <h1 style={heading}>Welcome to FieldWise, {name}!</h1>
                                            <p style={paragraph}>
                                            Your account has been created and is ready to use. Here are your
                                            login credentials:
                                            </p>
                                            <p style={{...paragraph, marginTop: '20px' }}>
                                                <strong>Email:</strong> {email}
                                            </p>
                                            {tempPassword && (
                                            <p style={{...paragraph, marginTop: '0' }}>
                                                <strong>Temporary Password:</strong> {tempPassword}
                                            </p>
                                            )}
                                            <p style={paragraph}>
                                            For security reasons, you will be required to change this password
                                            upon your first login.
                                            </p>
                                            <div style={btnContainer}>
                                                <a href={loginUrl.toString()} style={button}>
                                                    Login to Your Account
                                                </a>
                                            </div>
                                            <hr style={hr} />
                                            <p style={footer}>
                                                FieldWise | Enterprise-grade field service management
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                  </td>
              </tr>
          </tbody>
      </table>
    </body>
  </html>
)};

export default EmailTemplate;
