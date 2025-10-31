import Breadcrumbs from '@/components/breadcrumbs';
import TopicsAnalytics from '@/components/topics-analytics';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Topics Analytics | Stumbleable Admin',
    description: 'Content distribution and analytics by topic.',
};

export default async function TopicsPage() {
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
                    { label: 'Topics Analytics', href: '/admin/topics' }
                ]} />
                <TopicsAnalytics />
            </div>
        </div>
    );
}
