import Breadcrumbs from '@/components/breadcrumbs';
import ModerationPanel from '@/components/moderation-panel';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Content Moderation | Stumbleable',
    description: 'Moderate and review submitted content for Stumbleable.',
};

export default async function ModerationPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Note: Role checking is done client-side in ModerationPanel
    // Real security is enforced by:
    // 1. Database RLS policies (check user.role IN ('moderator', 'admin'))
    // 2. API endpoint validation (user-service checks roles)
    // 3. Client-side UX (ModerationPanel checks and shows appropriate UI)

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' },
                    { label: 'Content Moderation', href: '/admin/moderation' }
                ]} />
                <ModerationPanel />
            </div>
        </div>
    );
}