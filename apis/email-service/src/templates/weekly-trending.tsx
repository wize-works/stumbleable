import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { WeeklyTrendingEmailProps } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';

export function WeeklyTrendingEmail({
    discoveries,
    weekStart,
    weekEnd,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: WeeklyTrendingEmailProps) {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <EmailLayout
            previewText="🔥 Check out this week's top 5 trending discoveries on Stumbleable!"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Heading style={h1}>🔥 This Week's Top Trending Discoveries</Heading>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Here are the 5 most popular discoveries from <strong>{formatDate(startDate)}</strong> to{' '}
                <strong>{formatDate(endDate)}</strong>. These pages have been loved by the Stumbleable
                community this week!
            </Text>

            {discoveries.length > 0 ? (
                <>
                    {discoveries.map((discovery, index) => {
                        const stats = [];
                        if (discovery.like_count) stats.push(`${discovery.like_count} likes`);
                        if (discovery.save_count) stats.push(`${discovery.save_count} saves`);
                        if (discovery.share_count) stats.push(`${discovery.share_count} shares`);
                        const statsText = stats.length > 0 ? stats.join(' • ') : 'Just discovered';
                        const rank = index + 1;

                        return (
                            <Section key={discovery.id} style={card}>
                                <table width="100%" cellPadding="0" cellSpacing="0">
                                    <tr>
                                        <td width="40" style={rankCell}>
                                            <Text style={rankNumber}>{rank}</Text>
                                        </td>
                                        <td>
                                            <Heading style={cardTitle}>
                                                <a href={discovery.url} style={cardLink}>
                                                    {discovery.title}
                                                </a>
                                            </Heading>
                                            {discovery.description && <Text style={cardDescription}>{discovery.description}</Text>}
                                            <Text style={cardMeta}>
                                                {discovery.domain}
                                                {discovery.topics && discovery.topics.length > 0 && (
                                                    <>
                                                        {' • '}
                                                        {discovery.topics.slice(0, 2).join(', ')}
                                                    </>
                                                )}
                                            </Text>
                                            <Text style={cardStats}>
                                                🔥 <strong>{statsText}</strong>
                                            </Text>
                                        </td>
                                    </tr>
                                </table>
                            </Section>
                        );
                    })}
                </>
            ) : (
                <Section style={emptyState}>
                    <Text style={emptyText}>
                        No trending discoveries this week. Check back next Monday!
                    </Text>
                </Section>
            )}

            <Section style={buttonContainer}>
                <Button style={button} href={`${frontendUrl}/stumble`}>
                    Discover More
                </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footerNote}>
                💡 <strong>Want to see what's new?</strong> Look out for our Thursday email featuring the
                freshest discoveries added this week.
            </Text>

            <Text style={footerNote}>
                You're receiving this because you opted in to weekly trending emails.{' '}
                <a href={`${frontendUrl}/email/preferences`} style={link}>
                    Manage your email preferences
                </a>
            </Text>
        </EmailLayout>
    );
}

// Styles
const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '32px 0 24px',
    lineHeight: '1.3',
};

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
};

const card = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
};

const rankCell = {
    verticalAlign: 'top' as const,
    paddingRight: '16px',
};

const rankNumber = {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#6366f1',
    margin: 0,
    lineHeight: '1',
};

const cardTitle = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
    lineHeight: '1.4',
};

const cardLink = {
    color: '#1f2937',
    textDecoration: 'none',
};

const cardDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '8px 0',
};

const cardMeta = {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '8px 0 4px 0',
};

const cardStats = {
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '8px 0 0 0',
};

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const button = {
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

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const footerNote = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '12px 0',
};

const emptyState = {
    textAlign: 'center' as const,
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    margin: '24px 0',
};

const emptyText = {
    color: '#6b7280',
    fontSize: '16px',
    margin: 0,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default WeeklyTrendingEmail;
