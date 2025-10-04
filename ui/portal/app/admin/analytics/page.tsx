import AnalyticsDashboard from '@/components/analytics-dashboard';
import Breadcrumbs from '@/components/breadcrumbs';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Analytics Dashboard | Stumbleable Admin',
    description: 'Comprehensive analytics and insights for the Stumbleable platform.',
};

export default async function AnalyticsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' },
                    { label: 'Analytics Dashboard', href: '/admin/analytics' }
                ]} />
                <AnalyticsDashboard />
            </div>
        </div>
    );
}
