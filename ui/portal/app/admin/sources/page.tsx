import Breadcrumbs from '@/components/breadcrumbs';
import CrawlerManagement from '@/components/crawler-management';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Admin crawler sources management page
 * Accessible only to admin users
 */
export default async function AdminSourcesPage() {
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in');
    }

    return (
        <div className="min-h-screen bg-base-200">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' },
                    { label: 'Crawler Sources', href: '/admin/sources' }
                ]} />
                <CrawlerManagement />
            </div>
        </div>
    );
}