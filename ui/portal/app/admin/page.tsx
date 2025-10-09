import AdminDashboard from '@/components/admin-dashboard';
import Breadcrumbs from '@/components/breadcrumbs';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Stumbleable',
    description: 'Administrative dashboard for managing Stumbleable platform.',
};

export default async function AdminPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Note: Role checking is done client-side in AdminDashboard
    // Real security is enforced by:
    // 1. Database RLS policies (check user.role = 'admin')
    // 2. API endpoint validation (user-service checks roles)
    // 3. Client-side UX (AdminDashboard checks and shows appropriate UI)

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' }
                ]} />
                <AdminDashboard />
            </div>
        </div>
    );
}
