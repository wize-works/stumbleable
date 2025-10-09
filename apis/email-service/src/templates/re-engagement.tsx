import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Discovery } from '../types';
import { EmailLayout } from './components/EmailLayout';

interface ReEngagementEmailProps {
    discoveries: Discovery[];
    daysSinceLastVisit: number;
    totalSavedCount?: number;
    firstName?: string;
    email: string;
    frontendUrl: string;
    unsubscribeUrl: string;
}

export function ReEngagementEmail({
    discoveries,
    daysSinceLastVisit,
    totalSavedCount = 0,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: ReEngagementEmailProps) {
    const weeksAway = Math.floor(daysSinceLastVisit / 7);

    return (
        <EmailLayout
            previewText={`We miss you! Check out what's new on Stumbleable`}
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={header}>
                <Text style={headerIcon}>👋</Text>
                <Heading style={h1}>We Miss You!</Heading>
                <Text style={headerSubtitle}>
                    It's been {weeksAway > 0 ? `${weeksAway} ${weeksAway === 1 ? 'week' : 'weeks'}` : `${daysSinceLastVisit} days`} since your last visit
                </Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                The web is full of amazing discoveries waiting for you! We've curated some fresh content
                that we think you'll love.
            </Text>

            <Section style={highlightBox}>
                <Text style={highlightIcon}>✨</Text>
                <Text style={highlightTitle}>While You Were Away</Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={statsTable}>
                    <tr>
                        <td width="50%" style={statCell}>
                            <Text style={statEmoji}>🔥</Text>
                            <Text style={statNumber}>{discoveries.length}</Text>
                            <Text style={statLabel}>Trending Discoveries</Text>
                        </td>
                        {totalSavedCount > 0 && (
                            <td width="50%" style={statCell}>
                                <Text style={statEmoji}>🔖</Text>
                                <Text style={statNumber}>{totalSavedCount}</Text>
                                <Text style={statLabel}>Waiting in Your Saved</Text>
                            </td>
                        )}
                    </tr>
                </table>
            </Section>

            <Heading style={h2}>Trending Now</Heading>

            <Text style={introText}>
                Here are some of the most popular discoveries from the community:
            </Text>

            {discoveries.map((discovery, index) => {
                const { url, title, description, domain, topics, like_count, save_count } = discovery;
                return (
                    <Section key={discovery.id} style={discoveryCard}>
                        <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                                <td>
                                    <Text style={discoveryRank}>#{index + 1}</Text>
                                    <Text style={discoveryDomain}>{domain}</Text>

                                    <a href={url} style={discoveryTitleLink}>
                                        <Heading style={discoveryTitle}>{title}</Heading>
                                    </a>

                                    {description && (
                                        <Text style={discoveryDescription}>
                                            {description.length > 100 ? `${description.substring(0, 100)}...` : description}
                                        </Text>
                                    )}

                                    {topics && topics.length > 0 && (
                                        <table width="100%" cellPadding="0" cellSpacing="0" style={topicTable}>
                                            <tr>
                                                <td>
                                                    {topics.slice(0, 3).map((topic) => (
                                                        <Text key={topic} style={topicChip}>
                                                            {topic}
                                                        </Text>
                                                    ))}
                                                </td>
                                            </tr>
                                        </table>
                                    )}

                                    <table width="100%" cellPadding="0" cellSpacing="0" style={statsActionRow}>
                                        <tr>
                                            <td>
                                                {like_count !== undefined && (
                                                    <Text style={statItem}>👍 {like_count}</Text>
                                                )}
                                                {save_count !== undefined && (
                                                    <Text style={statItem}>🔖 {save_count}</Text>
                                                )}
                                            </td>
                                            <td style={actionCell}>
                                                <Button style={buttonVisit} href={url}>
                                                    Visit →
                                                </Button>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </Section>
                );
            })}

            <Section style={ctaBox}>
                <Heading style={ctaTitle}>Ready to Explore?</Heading>
                <Text style={ctaText}>
                    One click brings you back to the joy of discovery. No feeds, no algorithms to game—just
                    pure serendipity.
                </Text>
                <Button style={buttonPrimary} href={`${frontendUrl}/stumble`}>
                    Start Stumbling Again
                </Button>
            </Section>

            <Hr style={hr} />

            <Heading style={h2}>What's New on Stumbleable</Heading>

            <Section style={updatesList}>
                <table width="100%" cellPadding="0" cellSpacing="0" style={updateItem}>
                    <tr>
                        <td width="40" style={updateIconCell}>
                            <Text style={updateEmoji}>🎯</Text>
                        </td>
                        <td>
                            <Text style={updateTitle}>Improved Discovery Algorithm</Text>
                            <Text style={updateDescription}>We've fine-tuned the wildness controls for even better content matching.</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={updateItem}>
                    <tr>
                        <td width="40" style={updateIconCell}>
                            <Text style={updateEmoji}>📊</Text>
                        </td>
                        <td>
                            <Text style={updateTitle}>Creator Analytics</Text>
                            <Text style={updateDescription}>Submit content and track how the community engages with your discoveries.</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={updateItem}>
                    <tr>
                        <td width="40" style={updateIconCell}>
                            <Text style={updateEmoji}>🎨</Text>
                        </td>
                        <td>
                            <Text style={updateTitle}>Custom Lists</Text>
                            <Text style={updateDescription}>Organize your saved discoveries into collections by theme or interest.</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Section style={personalBox}>
                <Text style={personalTitle}>🌟 Your Discovery Journey</Text>
                {totalSavedCount > 0 ? (
                    <Text style={personalText}>
                        You have <strong>{totalSavedCount} saved {totalSavedCount === 1 ? 'discovery' : 'discoveries'}</strong> waiting
                        for you. Why not revisit some favorites or continue exploring?
                    </Text>
                ) : (
                    <Text style={personalText}>
                        Start building your collection of amazing discoveries. Every stumble is a chance to
                        find something extraordinary.
                    </Text>
                )}
                <Button style={buttonSecondary} href={`${frontendUrl}/saved`}>
                    View Your Saved Items
                </Button>
            </Section>

            <Hr style={hr} />

            <Section style={reminderBox}>
                <Text style={reminderTitle}>💡 Remember: Quality Over Quantity</Text>
                <Text style={reminderText}>
                    Stumbleable isn't about endless scrolling. It's about meaningful discoveries. Take a few
                    minutes to explore something new, save what resonates, and come back when curiosity
                    strikes again.
                </Text>
            </Section>

            <Text style={welcomeBack}>
                We'd love to have you back. The internet is a big place—let's explore it together! 🚀
            </Text>

            <Text style={signature}>
                — The Stumbleable Team
            </Text>

            <Section style={unsubscribeNote}>
                <Text style={unsubscribeText}>
                    Not interested in coming back?{' '}
                    <a href={unsubscribeUrl} style={link}>
                        Unsubscribe from re-engagement emails
                    </a>
                    .
                </Text>
            </Section>
        </EmailLayout>
    );
}

// Styles
const header = {
    textAlign: 'center' as const,
    margin: '24px 0',
};

const headerIcon = {
    fontSize: '48px',
    margin: '0 0 16px 0',
    lineHeight: '1',
};

const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px',
    lineHeight: '1.3',
    textAlign: 'center' as const,
};

const headerSubtitle = {
    color: '#6b7280',
    fontSize: '15px',
    margin: 0,
    textAlign: 'center' as const,
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

const introText = {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 20px',
};

const highlightBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const highlightIcon = {
    fontSize: '32px',
    margin: '0 0 12px 0',
    lineHeight: '1',
};

const highlightTitle = {
    color: '#1e40af',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
};

const statCell = {
    textAlign: 'center' as const,
    padding: '0 10px',
};

const statEmoji = {
    fontSize: '24px',
    margin: '0 0 8px 0',
    display: 'block',
    lineHeight: '1',
};

const statNumber = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1',
    display: 'block',
};

const statLabel = {
    color: '#6b7280',
    fontSize: '13px',
    margin: 0,
    display: 'block',
};

const discoveryCard = {
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    margin: '0 0 16px 0',
};

const discoveryRank = {
    color: '#6366f1',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    margin: '0 8px 0 0',
    display: 'inline',
};

const discoveryDomain = {
    color: '#6b7280',
    fontSize: '13px',
    margin: 0,
    display: 'inline',
};

const discoveryTitleLink = {
    textDecoration: 'none',
};

const discoveryTitle = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '12px 0 8px',
    lineHeight: '1.4',
};

const discoveryDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '8px 0',
};

const topicChip = {
    display: 'inline-block',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '12px',
    margin: '0 6px 6px 0',
};

const statItem = {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 12px 0 0',
    display: 'inline',
};

const statsTable = { marginTop: '16px' };
const topicTable = { margin: '12px 0 0' };
const statsActionRow = { marginTop: '12px' };
const actionCell = { textAlign: 'right' as const };
const updateItem = { marginBottom: '16px' };
const updateIconCell = { verticalAlign: 'top' as const };

const buttonVisit = {
    backgroundColor: '#6366f1',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '8px 20px',
};

const ctaBox = {
    backgroundColor: '#faf5ff',
    borderRadius: '12px',
    padding: '32px 24px',
    margin: '32px 0',
    textAlign: 'center' as const,
};

const ctaTitle = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px',
};

const ctaText = {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 20px',
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
    padding: '14px 36px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const updatesList = {
    margin: '16px 0',
};

const updateEmoji = {
    fontSize: '24px',
    margin: 0,
    lineHeight: '1',
};

const updateTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1.4',
};

const updateDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const personalBox = {
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const personalTitle = {
    color: '#92400e',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const personalText = {
    color: '#78350f',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px',
};

const buttonSecondary = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '10px 24px',
    border: '2px solid #d1d5db',
};

const reminderBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const reminderTitle = {
    color: '#1e40af',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const reminderText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '22px',
    margin: 0,
};

const welcomeBack = {
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
    margin: '4px 0 24px',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

const unsubscribeNote = {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
    margin: '24px 0 0',
};

const unsubscribeText = {
    color: '#9ca3af',
    fontSize: '13px',
    textAlign: 'center' as const,
    margin: 0,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default ReEngagementEmail;
