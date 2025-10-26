import Breadcrumbs from '@/components/breadcrumbs';
import LaunchPlatformManagement from '@/components/launch-platform-management';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Admin launch platforms management page
 * Accessible only to admin users
 */
export default async function AdminLaunchPlatformsPage() {
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
                    { label: 'Launch Platforms', href: '/admin/launch-platforms' }
                ]} />
                <LaunchPlatformManagement />
            </div>
        </div>
    );
}
