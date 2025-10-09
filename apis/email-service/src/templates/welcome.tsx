import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { WelcomeEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';
import { LightbulbIcon, PartyIcon } from './components/Icons';

export function WelcomeEmail({
    firstName = 'there',
    preferredTopics = [],
    email,
    frontendUrl,
    unsubscribeUrl,
}: WelcomeEmailProps) {
    return (
        <EmailLayout
            previewText={`Welcome to Stumbleable, ${firstName}! Start discovering amazing content.`}
            unsubscribeUrl={unsubscribeUrl}
        >
            <Heading style={h1}>
                Welcome to Stumbleable! <PartyIcon size={32} style={{ marginLeft: '8px' }} />
            </Heading>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                We're thrilled to have you join our community of curious explorers! Stumbleable is your
                gateway to serendipitous discovery - one click, one surprising page at a time.
            </Text>

            {preferredTopics && preferredTopics.length > 0 && (
                <>
                    <Text style={text}>
                        We noticed you're interested in:{' '}
                        <strong>{preferredTopics.join(', ')}</strong>
                    </Text>
                    <Text style={text}>
                        We'll use your interests to help guide your discoveries, but don't worry - we'll
                        also throw in some surprises along the way! That's what makes stumbling fun.
                    </Text>
                </>
            )}

            <Section style={buttonContainer}>
                <Button style={button} href={`${frontendUrl}/stumble`}>
                    Start Stumbling
                </Button>
            </Section>

            <Heading style={h2}>Quick Start Guide</Heading>

            <Text style={text}>
                <strong>1. Hit the Stumble Button</strong> - We'll show you something interesting
            </Text>
            <Text style={text}>
                <strong>2. React</strong> - Like it? Save it? Share it? Let us know!
            </Text>
            <Text style={text}>
                <strong>3. Adjust Your Wildness</strong> - Control how far you wander from your interests
            </Text>
            <Text style={text}>
                <strong>4. Discover More</strong> - Keep stumbling to find your next favorite site
            </Text>

            <Section style={box}>
                <Text style={boxText}>
                    <LightbulbIcon size={18} style={{ marginRight: '8px' }} /> <strong>Pro Tip:</strong> Use the keyboard shortcuts for faster stumbling:
                    <br />
                    <strong style={codeStyle}>Space</strong> = Next discovery
                    <br />
                    <strong style={codeStyle}>↑</strong> = Like • <strong style={codeStyle}>↓</strong> = Skip
                    <br />
                    <strong style={codeStyle}>S</strong> = Save • <strong style={codeStyle}>Shift+S</strong> = Share
                </Text>
            </Section>

            <Text style={text}>
                Got questions? Check out our{' '}
                <a href={`${frontendUrl}/how-it-works`} style={link}>
                    How It Works
                </a>{' '}
                page or{' '}
                <a href={`${frontendUrl}/contact`} style={link}>
                    reach out to us
                </a>
                . We're here to help!
            </Text>

            <Text style={text}>
                Happy stumbling!
            </Text>
            <Text style={text}>
                The Stumbleable Team
            </Text>
        </EmailLayout>
    );
}

// Styles
const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '32px 0 24px',
    lineHeight: '1.3',
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '32px 0 16px',
};

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
};

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const button = {
    backgroundColor: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const box = {
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const boxText = {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '22px',
    margin: 0,
};

const link = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    textDecoration: 'underline',
};

const codeStyle = {
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
};

export default WelcomeEmail;
