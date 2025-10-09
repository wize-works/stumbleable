import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { DeletionCancelledEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';
import { BookmarkIcon, CheckIcon, CommentIcon, FireIcon, LightbulbIcon, PartyIcon, RocketIcon, TargetIcon } from './components/Icons';

export function DeletionCancelledEmail({
    cancelledDate,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: DeletionCancelledEmailProps) {
    const formattedDate = new Date(cancelledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <EmailLayout
            previewText="Welcome back! Your account deletion has been cancelled"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={celebrationBanner}>
                <PartyIcon size={48} />
                <Heading style={h1}>Welcome Back!</Heading>
                <Text style={bannerText}>Your account has been restored</Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Great news! Your account deletion request has been successfully cancelled as of{' '}
                {formattedDate}. We're thrilled to have you back with Stumbleable!
            </Text>

            <Section style={statusBox}>
                <Text style={statusTitle}>
                    <CheckIcon size={18} style={{ marginRight: '8px' }} /> Your Account Status
                </Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={statusRow}>
                    <tr>
                        <td width="140">
                            <Text style={statusLabel}>Account:</Text>
                        </td>
                        <td>
                            <Text style={statusValue}>Active</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={statusRow}>
                    <tr>
                        <td width="140">
                            <Text style={statusLabel}>Saved Discoveries:</Text>
                        </td>
                        <td>
                            <Text style={statusValue}>Fully Restored</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={statusRow}>
                    <tr>
                        <td width="140">
                            <Text style={statusLabel}>Preferences:</Text>
                        </td>
                        <td>
                            <Text style={statusValue}>Intact</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={statusRow}>
                    <tr>
                        <td width="140">
                            <Text style={statusLabel}>Interaction History:</Text>
                        </td>
                        <td>
                            <Text style={statusValue}>Preserved</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Heading style={h2}>Ready to Stumble Again?</Heading>

            <Text style={text}>
                Everything is exactly as you left it. Your preferences, saved discoveries, and interaction
                history are all waiting for you.
            </Text>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={`${frontendUrl}/stumble`}>
                    Start Stumbling
                </Button>
            </Section>

            <Section style={quickLinksBox}>
                <Text style={quickLinksTitle}>Quick Links to Get Back In:</Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={quickLinkRow}>
                    <tr>
                        <td width="30" style={quickLinkIconCell}>
                            <BookmarkIcon size={18} />
                        </td>
                        <td>
                            <a href={`${frontendUrl}/saved`} style={quickLinkText}>
                                View your saved discoveries
                            </a>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={quickLinkRow}>
                    <tr>
                        <td width="30" style={quickLinkIconCell}>
                            <TargetIcon size={18} />
                        </td>
                        <td>
                            <a href={`${frontendUrl}/dashboard`} style={quickLinkText}>
                                Update your interests
                            </a>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={quickLinkRow}>
                    <tr>
                        <td width="30" style={quickLinkIconCell}>
                            <FireIcon size={18} />
                        </td>
                        <td>
                            <a href={`${frontendUrl}/explore?sort=trending`} style={quickLinkText}>
                                Check out trending content
                            </a>
                        </td>
                    </tr>
                </table>
            </Section>

            <Heading style={h2}>We're Here to Help</Heading>

            <Text style={text}>
                If you had any concerns that led to the deletion request, we'd love to hear about them and
                see how we can improve your experience.
            </Text>

            <Section style={supportBox}>
                <Text style={supportText}>
                    <CommentIcon size={18} style={{ marginRight: '8px' }} /> <a href={`${frontendUrl}/contact`} style={link}>Share your feedback</a> or{' '}
                    <a href={`${frontendUrl}/help`} style={link}>browse our help center</a> if you need
                    assistance.
                </Text>
            </Section>

            <Section style={tipBox}>
                <Text style={tipTitle}>
                    <LightbulbIcon size={18} style={{ marginRight: '8px' }} /> Did You Know?
                </Text>
                <Text style={tipText}>
                    You can always take a break without deleting your account. Just sign out and come back
                    whenever you're ready. Your discoveries will be waiting!
                </Text>
            </Section>

            <Text style={welcomeBack}>
                We're glad you decided to stay. Happy stumbling! <RocketIcon size={20} style={{ marginLeft: '4px' }} />
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

const statusBox = {
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const statusTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
};

const statusLabel = {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
};

const statusValue = {
    color: '#17E68F', // Brand success color
    fontSize: '14px',
    fontWeight: '600' as const,
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

const quickLinksBox = {
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const quickLinksTitle = {
    color: '#1F262E', // Brand neutral color
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const quickLinkText = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    fontSize: '14px',
    textDecoration: 'underline',
    lineHeight: '1.5',
};

// Inline styles extracted to consts
const statusRow = { marginBottom: '8px' };
const quickLinkRow = { marginBottom: '10px' };
const quickLinkIconCell = { verticalAlign: 'middle' as const };

const supportBox = {
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const supportText = {
    color: '#374151', // Standard text gray
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
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

const welcomeBack = {
    color: '#6b7280',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '24px 0 8px',
    fontStyle: 'italic' as const,
};

const signature = {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '4px 0',
    fontStyle: 'italic' as const,
};

const link = {
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    textDecoration: 'underline',
};

export default DeletionCancelledEmail;
