import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Link,
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
            {previewText && (
                <div
                    style={{
                        display: 'none',
                        overflow: 'hidden',
                        lineHeight: '1px',
                        opacity: 0,
                        maxHeight: 0,
                        maxWidth: 0,
                    }}
                >
                    {previewText}
                </div>
            )}
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>Stumbleable</Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>{children}</Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            You're receiving this email because you have an account on Stumbleable.
                        </Text>
                        <Text style={footerLinks}>
                            <Link href={unsubscribeUrl} style={link}>
                                Unsubscribe
                            </Link>
                            {' • '}
                            <Link href="https://stumbleable.com/privacy" style={link}>
                                Privacy Policy
                            </Link>
                            {' • '}
                            <Link href="https://stumbleable.com/contact" style={link}>
                                Contact Us
                            </Link>
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} Stumbleable. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
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
    maxWidth: '600px',
};

const header = {
    padding: '32px 48px 24px',
    textAlign: 'center' as const,
};

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6366f1',
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
    color: '#6366f1',
    textDecoration: 'none',
};
