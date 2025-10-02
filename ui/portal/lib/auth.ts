import { currentUser } from '@clerk/nextjs/server';
export async function requireAuth() {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');
    return { userId: user.id, user };
}