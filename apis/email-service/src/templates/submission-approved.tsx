import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { SubmissionEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function SubmissionApprovedEmail({
    submissionUrl,
    submissionTitle,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: SubmissionEmailProps) {
    return (
        <EmailLayout
            previewText="🎉 Your submission has been approved!"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={celebrationBanner}>
                <Text style={celebrationIcon}>🎉</Text>
                <Heading style={h1}>Submission Approved!</Heading>
                <Text style={bannerText}>Your content is now live on Stumbleable</Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Great news! Your submission has been approved and is now discoverable on Stumbleable.
            </Text>

            <Section style={submissionBox}>
                <Text style={submissionLabel}>✓ APPROVED</Text>
                <Text style={submissionUrlText}>{submissionUrl}</Text>
                <Text style={submissionTitleText}>{submissionTitle}</Text>
            </Section>

            <Heading style={h2}>What This Means</Heading>

            <Section style={benefitsList}>
                <BenefitItem
                    icon="🌍"
                    title="Now Discoverable"
                    description="Users can now stumble upon your submission in their discovery feed."
                />
                <BenefitItem
                    icon="🎯"
                    title="Smart Matching"
                    description="Our algorithm will show it to users with matching interests and wildness levels."
                />
                <BenefitItem
                    icon="📊"
                    title="Track Performance"
                    description="You can see how it's performing in your submission dashboard."
                />
            </Section>

            <Section style={statsBox}>
                <Text style={statsTitle}>📈 Track Your Submission</Text>
                <Text style={statsText}>
                    Watch as users discover, like, save, and share your submission. Check your dashboard to
                    see real-time engagement metrics.
                </Text>
            </Section>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={`${frontendUrl}/submit`}>
                    View Submission Dashboard
                </Button>
            </Section>

            <Heading style={h2}>Share the Love</Heading>

            <Text style={text}>
                Help spread the word about Stumbleable! Every submission makes our discovery engine better.
            </Text>

            <Section style={shareBox}>
                <Text style={shareTitle}>💬 Ways to Help:</Text>
                <Section style={shareList}>
                    <ShareItem text="Submit more great content you've discovered" />
                    <ShareItem text="Share Stumbleable with friends who love discovery" />
                    <ShareItem text="Give feedback on submissions you stumble upon" />
                </Section>
            </Section>

            <Section style={tipBox}>
                <Text style={tipTitle}>💡 Pro Tip</Text>
                <Text style={tipText}>
                    Submissions that get early engagement (likes, saves, shares) tend to reach more users
                    through our algorithm. Share it with your network to give it a boost!
                </Text>
            </Section>

            <Text style={thanks}>
                Thank you for contributing quality content to the community! 🚀
            </Text>

            <Text style={signature}>
                — The Stumbleable Team
            </Text>
        </EmailLayout>
    );
}

interface BenefitItemProps {
    icon: string;
    title: string;
    description: string;
}

function BenefitItem({ icon, title, description }: BenefitItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
            <tr>
                <td width="40" style={{ verticalAlign: 'top' as const }}>
                    <Text style={benefitIcon}>{icon}</Text>
                </td>
                <td>
                    <Text style={benefitTitle}>{title}</Text>
                    <Text style={benefitDescription}>{description}</Text>
                </td>
            </tr>
        </table>
    );
}

interface ShareItemProps {
    text: string;
}

function ShareItem({ text }: ShareItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '8px' }}>
            <tr>
                <td width="24" style={{ verticalAlign: 'middle' as const }}>
                    <Text style={checkmark}>→</Text>
                </td>
                <td>
                    <Text style={shareItemText}>{text}</Text>
                </td>
            </tr>
        </table>
    );
}

// Styles
const celebrationBanner = {
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
    border: '2px solid #86efac',
};

const celebrationIcon = {
    fontSize: '48px',
    margin: '0 0 16px 0',
    lineHeight: '1',
};

const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px',
    textAlign: 'center' as const,
};

const bannerText = {
    color: '#059669',
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: 0,
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '32px 0 16px',
};

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
};

const submissionBox = {
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    borderLeft: '4px solid #10b981',
};

const submissionLabel = {
    color: '#059669',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0 0 8px 0',
    fontWeight: 'bold' as const,
};

const submissionUrlText = {
    color: '#6366f1',
    fontSize: '14px',
    margin: '0 0 8px 0',
    wordBreak: 'break-all' as const,
};

const submissionTitleText = {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: 0,
};

const benefitsList = {
    margin: '24px 0',
};

const benefitIcon = {
    fontSize: '24px',
    margin: 0,
    lineHeight: '1',
};

const benefitTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1.4',
};

const benefitDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const statsBox = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const statsTitle = {
    color: '#1e40af',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const statsText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const buttonPrimary = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const shareBox = {
    backgroundColor: '#faf5ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const shareTitle = {
    color: '#6b21a8',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const shareList = {
    margin: 0,
};

const checkmark = {
    color: '#6366f1',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: 0,
};

const shareItemText = {
    color: '#374151',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
};

const tipBox = {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const tipTitle = {
    color: '#92400e',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const tipText = {
    color: '#78350f',
    fontSize: '13px',
    lineHeight: '20px',
    margin: 0,
};

const thanks = {
    color: '#6b7280',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '24px 0 8px',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

const signature = {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '4px 0',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

export default SubmissionApprovedEmail;
