import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Discovery } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';

interface SavedDigestEmailProps {
    discoveries: Discovery[];
    totalSaved: number;
    periodStart: string;
    periodEnd: string;
    firstName?: string;
    email: string;
    frontendUrl: string;
    unsubscribeUrl: string;
}

export function SavedDigestEmail({
    discoveries,
    totalSaved,
    periodStart,
    periodEnd,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: SavedDigestEmailProps) {
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const formattedPeriod = `${startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })} - ${endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })}`;

    const hasMoreThanShown = totalSaved > discoveries.length;

    return (
        <EmailLayout
            previewText={`Your saved discoveries from ${formattedPeriod}`}
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={header}>
                <Text style={headerIcon}>🔖</Text>
                <Heading style={h1}>Your Saved Discoveries</Heading>
                <Text style={headerSubtitle}>{formattedPeriod}</Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Here's a recap of the {totalSaved} {totalSaved === 1 ? 'discovery' : 'discoveries'} you
                saved recently. Ready to revisit some great content?
            </Text>

            <Section style={statsBar}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                    <tr>
                        <td style={statCell}>
                            <Text style={statNumber}>{totalSaved}</Text>
                            <Text style={statLabel}>Saved</Text>
                        </td>
                        <td style={statCell}>
                            <Text style={statNumber}>{discoveries.length}</Text>
                            <Text style={statLabel}>Featured</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Heading style={h2}>Your Saved Collection</Heading>

            {discoveries.map((discovery, index) => {
                const { url, title, description, domain, topics, image_url } = discovery;

                return (
                    <Section key={discovery.id} style={discoveryCard}>
                        <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                                <td>
                                    <table width="100%" cellPadding="0" cellSpacing="0">
                                        <tr>
                                            <td>
                                                <Text style={discoveryNumber}>#{index + 1}</Text>
                                                <Text style={discoveryDomain}>{domain}</Text>
                                            </td>
                                            <td style={savedBadgeCell}>
                                                <Text style={savedBadge}>SAVED</Text>
                                            </td>
                                        </tr>
                                    </table>

                                    <a href={url} style={discoveryTitleLink}>
                                        <Heading style={discoveryTitle}>{title}</Heading>
                                    </a>

                                    {description && (
                                        <Text style={discoveryDescription}>
                                            {description.length > 120 ? `${description.substring(0, 120)}...` : description}
                                        </Text>
                                    )}

                                    {topics && topics.length > 0 && (
                                        <table width="100%" cellPadding="0" cellSpacing="0" style={topicsContainer}>
                                            <tr>
                                                <td>
                                                    <Text style={topicText}>
                                                        {topics.slice(0, 3).map((topic, idx) => (
                                                            <React.Fragment key={topic}>
                                                                <strong style={topicChip}>{topic}</strong>
                                                                {idx < Math.min(2, topics.length - 1) && ' '}
                                                            </React.Fragment>
                                                        ))}
                                                        {topics.length > 3 && (
                                                            <em style={topicMore}> +{topics.length - 3} more</em>
                                                        )}
                                                    </Text>
                                                </td>
                                            </tr>
                                        </table>
                                    )}

                                    <table width="100%" cellPadding="0" cellSpacing="0" style={actionRow}>
                                        <tr>
                                            <td>
                                                <Button style={buttonVisit} href={url}>
                                                    Visit Site
                                                </Button>
                                                <a href={`${url}?ref=stumbleable`} style={viewInAppLink}>
                                                    View in App →
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </Section>
                );
            })}

            {hasMoreThanShown && (
                <Section style={moreBox}>
                    <Text style={moreText}>
                        📚 Plus {totalSaved - discoveries.length} more saved{' '}
                        {totalSaved - discoveries.length === 1 ? 'discovery' : 'discoveries'}
                    </Text>
                    <Button style={buttonSecondary} href={`${frontendUrl}/saved`}>
                        View All Saved
                    </Button>
                </Section>
            )}

            <Hr style={hr} />

            <Section style={tipBox}>
                <Text style={tipTitle}>💡 Did You Know?</Text>
                <Text style={tipText}>
                    You can organize your saved discoveries into custom lists to keep track of different
                    interests. Try creating a list for your favorite topics!
                </Text>
            </Section>

            <Section style={ctaBox}>
                <Heading style={ctaTitle}>Ready for More?</Heading>
                <Text style={ctaText}>
                    Continue discovering amazing content with just one click.
                </Text>
                <Button style={buttonPrimary} href={`${frontendUrl}/stumble`}>
                    Start Stumbling
                </Button>
            </Section>

            <Text style={footerNote}>
                💬 Have feedback about these digests?{' '}
                <a href={`${frontendUrl}/contact`} style={link}>
                    Let us know
                </a>{' '}
                how we can make them better.
            </Text>
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
    fontSize: '16px',
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

const statsBar = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const statCell = {
    textAlign: 'center' as const,
    padding: '0 20px',
};

const statNumber = {
    color: '#1e40af',
    fontSize: '32px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1',
    display: 'block',
};

const statLabel = {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'block',
};

const discoveryCard = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    margin: '0 0 16px 0',
};

const discoveryNumber = {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '600' as const,
    margin: '0 8px 0 0',
    display: 'inline',
};

const discoveryDomain = {
    color: '#6b7280',
    fontSize: '13px',
    margin: 0,
    display: 'inline',
};

const savedBadge = {
    color: '#10b981',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: 0,
    backgroundColor: '#d1fae5',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block',
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

const topicsContainer = {
    margin: '12px 0',
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

const topicMore = {
    display: 'inline-block',
    color: '#9ca3af',
    fontSize: '12px',
    margin: '0 6px 6px 0',
};

const savedBadgeCell = { textAlign: 'right' as const };
const topicText = { margin: '0' };

const actionRow = {
    margin: '16px 0 0',
};

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
    marginRight: '12px',
};

const viewInAppLink = {
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: '600' as const,
    textDecoration: 'none',
};

const moreBox = {
    backgroundColor: '#faf5ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const moreText = {
    color: '#6b21a8',
    fontSize: '15px',
    fontWeight: '600' as const,
    margin: '0 0 12px 0',
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

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const tipBox = {
    backgroundColor: '#fffbeb',
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

const ctaBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '32px 24px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const ctaTitle = {
    color: '#1f2937',
    fontSize: '22px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px',
};

const ctaText = {
    color: '#6b7280',
    fontSize: '15px',
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
    padding: '12px 32px',
};

const footerNote = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '12px 0',
    textAlign: 'center' as const,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default SavedDigestEmail;
