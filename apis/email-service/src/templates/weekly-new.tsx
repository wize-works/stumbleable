import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Discovery, WeeklyNewEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function WeeklyNewEmail({
    discoveries,
    weekStart,
    weekEnd,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: WeeklyNewEmailProps) {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <EmailLayout
            previewText="✨ Fresh discoveries just added to Stumbleable. Be among the first to explore!"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Heading style={h1}>✨ 5 Fresh Discoveries Just Added</Heading>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Be among the first to discover these gems! Here are 5 brand new pages added to
                Stumbleable between <strong>{formatDate(startDate)}</strong> and{' '}
                <strong>{formatDate(endDate)}</strong>.
            </Text>

            <Section style={badgeContainer}>
                <span style={badge}>🌟 NEW</span>
                <Text style={badgeText}>Fresh content, unexplored territory</Text>
            </Section>

            {discoveries.length > 0 ? (
                <>
                    {discoveries.map((discovery) => (
                        <NewDiscoveryCard
                            key={discovery.id}
                            discovery={discovery}
                            frontendUrl={frontendUrl}
                        />
                    ))}
                </>
            ) : (
                <Section style={emptyState}>
                    <Text style={emptyText}>
                        No new discoveries this week. Check back next Thursday!
                    </Text>
                </Section>
            )}

            <Section style={buttonContainer}>
                <Button style={button} href={`${frontendUrl}/stumble`}>
                    Start Exploring
                </Button>
            </Section>

            <Hr style={hr} />

            <Section style={tipBox}>
                <Text style={tipTitle}>💡 Discovery Tip</Text>
                <Text style={tipText}>
                    New discoveries haven't been rated yet. Use your reactions to help the community know
                    what's worth exploring!
                </Text>
            </Section>

            <Text style={footerNote}>
                You're receiving this because you opted in to weekly new discovery emails.{' '}
                <a href={`${frontendUrl}/email/preferences`} style={link}>
                    Manage your email preferences
                </a>
            </Text>
        </EmailLayout>
    );
}

interface NewDiscoveryCardProps {
    discovery: Discovery;
    frontendUrl: string;
}

function NewDiscoveryCard({ discovery, frontendUrl }: NewDiscoveryCardProps) {
    return (
        <Section style={card}>
            <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                    <td width="50" style={iconCell}>
                        <Text style={sparkle}>✨</Text>
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
                                    {discovery.topics.slice(0, 3).join(', ')}
                                </>
                            )}
                        </Text>
                        <Section style={buttonGroup}>
                            <a href={discovery.url} style={smallButton}>
                                Visit Site
                            </a>
                            <a href={`${frontendUrl}/stumble?focus=${discovery.id}`} style={smallButtonOutline}>
                                View in App
                            </a>
                        </Section>
                    </td>
                </tr>
            </table>
        </Section>
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

const badgeContainer = {
    textAlign: 'center' as const,
    margin: '24px 0',
};

const badge = {
    display: 'inline-block',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    padding: '4px 12px',
    borderRadius: '12px',
    marginBottom: '8px',
};

const badgeText = {
    color: '#6b7280',
    fontSize: '14px',
    margin: '8px 0 0 0',
    textAlign: 'center' as const,
};

const card = {
    backgroundColor: '#ffffff',
    border: '2px solid #fef3c7',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
};

const iconCell = {
    verticalAlign: 'top' as const,
    paddingRight: '12px',
};

const sparkle = {
    fontSize: '32px',
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
    margin: '8px 0',
};

const buttonGroup = {
    marginTop: '12px',
};

const smallButton = {
    display: 'inline-block',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600' as const,
    padding: '8px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    marginRight: '8px',
};

const smallButtonOutline = {
    display: 'inline-block',
    backgroundColor: 'transparent',
    color: '#6366f1',
    fontSize: '13px',
    fontWeight: '600' as const,
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #6366f1',
    textDecoration: 'none',
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

const tipBox = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
};

const tipTitle = {
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const tipText = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
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

export default WeeklyNewEmail;
