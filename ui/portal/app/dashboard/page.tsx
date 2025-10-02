import { currentUser } from '@clerk/nextjs/server';

export default async function Dashboard() {
    const user = await currentUser();
    return (
        <main className="p-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2">Signed in as {user?.primaryEmailAddress?.emailAddress} (id: {user?.id})</p>
        </main>
    );
}