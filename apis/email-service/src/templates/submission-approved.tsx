import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { SubmissionEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';
import { ChartIcon, CommentIcon, GlobeIcon, LightbulbIcon, PartyIcon, RocketIcon, TargetIcon, TrendingIcon } from './components/Icons';

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
            previewText="Your submission has been approved!"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={celebrationBanner}>
                <PartyIcon size={48} />
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

            <div style={benefitsList}>
                <table width="100%" cellPadding="0" cellSpacing="0" style={benefitItem}>
                    <tbody>
                        <tr>
                            <td width="40" style={iconCell}>
                                <GlobeIcon size={24} />
                            </td>
                            <td>
                                <strong style={benefitTitle}>Now Discoverable</strong>
                                <br />
                                <span style={benefitDescription}>Users can now stumble upon your submission in their discovery feed.</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={benefitItem}>
                    <tbody>
                        <tr>
                            <td width="40" style={iconCell}>
                                <TargetIcon size={24} />
                            </td>
                            <td>
                                <strong style={benefitTitle}>Smart Matching</strong>
                                <br />
                                <span style={benefitDescription}>Our algorithm will show it to users with matching interests and wildness levels.</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={benefitItem}>
                    <tbody>
                        <tr>
                            <td width="40" style={iconCell}>
                                <ChartIcon size={24} />
                            </td>
                            <td>
                                <strong style={benefitTitle}>Track Performance</strong>
                                <br />
                                <span style={benefitDescription}>You can see how it's performing in your submission dashboard.</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Section style={statsBox}>
                <Text style={statsTitle}>
                    <TrendingIcon size={18} style={{ marginRight: '8px' }} /> Track Your Submission
                </Text>
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

            <div style={shareBox}>
                <div style={shareTitle}>
                    <CommentIcon size={18} style={{ marginRight: '8px' }} /> Ways to Help:
                </div>
                <table width="100%" cellPadding="0" cellSpacing="0" style={shareItem}>
                    <tbody>
                        <tr>
                            <td width="24" style={shareIconCell}>
                                <span style={checkmark}>→</span>
                            </td>
                            <td>
                                <span style={shareItemText}>Submit more great content you've discovered</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={shareItem}>
                    <tbody>
                        <tr>
                            <td width="24" style={shareIconCell}>
                                <span style={checkmark}>→</span>
                            </td>
                            <td>
                                <span style={shareItemText}>Share Stumbleable with friends who love discovery</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={shareItem}>
                    <tbody>
                        <tr>
                            <td width="24" style={shareIconCell}>
                                <span style={checkmark}>→</span>
                            </td>
                            <td>
                                <span style={shareItemText}>Give feedback on submissions you stumble upon</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Section style={tipBox}>
                <Text style={tipTitle}>
                    <LightbulbIcon size={18} style={{ marginRight: '8px' }} /> Pro Tip
                </Text>
                <Text style={tipText}>
                    Submissions that get early engagement (likes, saves, shares) tend to reach more users
                    through our algorithm. Share it with your network to give it a boost!
                </Text>
            </Section>

            <Text style={thanks}>
                Thank you for contributing quality content to the community! <RocketIcon size={20} style={{ marginLeft: '4px' }} />
            </Text>

            <Text style={signature}>
                — The Stumbleable Team
            </Text>
        </EmailLayout>
    );
}

// Styles
const celebrationBanner = {
    backgroundColor: '#EDFDF6', // Light success green tint
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
    border: '2px solid #7BF3B8', // Lighter brand success tint
};

const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px',
    textAlign: 'center' as const,
};

const bannerText = {
    color: '#17E68F', // Brand success color
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
    backgroundColor: '#EDFDF6', // Light success green tint
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    borderLeft: '4px solid #17E68F', // Brand success color
};

const submissionLabel = {
    color: '#17E68F', // Brand success color
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0 0 8px 0',
    fontWeight: 'bold' as const,
};

const submissionUrlText = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
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

const benefitItem = {
    marginBottom: '16px',
};

const iconCell = {
    verticalAlign: 'top' as const,
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
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const statsTitle = {
    color: '#1F262E', // Brand neutral color
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const statsText = {
    color: '#374151', // Standard text gray
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const buttonPrimary = {
    backgroundColor: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
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
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const shareTitle = {
    color: '#1F262E', // Brand neutral color
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const shareList = {
    margin: 0,
};

const shareItem = {
    marginBottom: '8px',
};

const shareIconCell = {
    verticalAlign: 'middle' as const,
};

const checkmark = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
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
    backgroundColor: '#FFF9E6', // Light warning yellow tint
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const tipTitle = {
    color: '#FF8C42', // Brand warning color
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const tipText = {
    color: '#6b7280', // Standard secondary text gray
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
