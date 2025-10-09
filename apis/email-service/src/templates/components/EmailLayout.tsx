import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
    children: React.ReactNode;
    previewText?: string;
    unsubscribeUrl: string;
}

export function EmailLayout({ children, previewText, unsubscribeUrl }: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            {previewText && <Preview>{previewText}</Preview>}
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>Stumbleable</Text>
                    </Section>

                    {/* Content */}
                    <div style={content}>{children}</div>

                    {/* Footer */}
                    <Hr style={hr} />
                    <div style={footer}>
                        <p style={footerText}>
                            You're receiving this email because you have an account on Stumbleable.
                        </p>
                        <p style={footerLinks}>
                            <a href={unsubscribeUrl} style={link}>Unsubscribe</a>
                            {' • '}
                            <a href="https://stumbleable.com/privacy" style={link}>Privacy Policy</a>
                            {' • '}
                            <a href="https://stumbleable.com/contact" style={link}>Contact Us</a>
                        </p>
                        <p style={footerCopyright}>
                            © {new Date().getFullYear()} Stumbleable. All rights reserved.
                        </p>
                    </div>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#EDE3D9', // Brand base-300 (cream background)
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#FFFDF7', // Brand base-100 (lightest cream)
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};

const header = {
    padding: '32px 48px 24px',
    textAlign: 'center' as const,
};

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    margin: 0,
};

const content = {
    padding: '0 48px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '40px 0',
};

const footer = {
    padding: '0 48px',
};

const footerText = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '16px',
    marginBottom: '8px',
};

const footerLinks = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '16px',
    textAlign: 'center' as const,
    marginBottom: '8px',
};

const footerCopyright = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '16px',
    textAlign: 'center' as const,
    marginTop: '16px',
};

const link = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    textDecoration: 'none',
};
