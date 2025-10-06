
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface EmailTemplateProps {
  name: string;
  email: string;
  tempPassword?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  email,
  tempPassword,
}) => (
  <Html>
    <Head />
    <Preview>Your FieldWise Account is Ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={'/Field Wise Logo.png'}
          width="48"
          height="48"
          alt="FieldWise"
        />
        <Heading style={heading}>Welcome to FieldWise, {name}!</Heading>
        <Text style={paragraph}>
          Your account has been created and is ready to use. Here are your
          login credentials:
        </Text>
        <Text style={credentialText}>
          <strong>Email:</strong> {email}
        </Text>
        {tempPassword && (
          <Text style={credentialText}>
            <strong>Temporary Password:</strong> {tempPassword}
          </Text>
        )}
        <Text style={paragraph}>
          For security reasons, you will be required to change this password
          upon your first login.
        </Text>
        <Link href={baseUrl} style={button}>
          Login to Your Account
        </Link>
        <Text style={footer}>
          FieldWise | Enterprise-grade field service management
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
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
  padding: '0 20px',
};

const credentialText = {
  ...paragraph,
  padding: '0 20px',
  margin: '10px 0',
};

const button = {
  backgroundColor: '#3498DB',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px',
  margin: '20px auto',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
