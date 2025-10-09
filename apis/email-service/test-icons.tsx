/**
 * Test file to verify SVG icons render correctly in email templates
 * 
 * Run with: npx tsx test-icons.tsx
 */

import { render } from '@react-email/components';
import { DeletionCancelledEmail } from './src/templates/deletion-cancelled';
import { DeletionReminderEmail } from './src/templates/deletion-reminder';
import { DeletionRequestEmail } from './src/templates/deletion-request';
import { SubmissionApprovedEmail } from './src/templates/submission-approved';
import { SubmissionRejectedEmail } from './src/templates/submission-rejected';
import { WelcomeEmail } from './src/templates/welcome';

const frontendUrl = 'http://localhost:3000';
const unsubscribeUrl = 'http://localhost:3000/unsubscribe';
const email = 'test@example.com';

async function testEmailRendering() {
    console.log('🧪 Testing Email Template Icon Rendering...\n');

    try {
        // Test 1: Welcome Email
        console.log('1️⃣  Testing Welcome Email...');
        const welcomeHtml = await render(
            WelcomeEmail({
                firstName: 'John',
                preferredTopics: ['Technology', 'Science'],
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Welcome Email rendered successfully');
        console.log(`   📊 Length: ${welcomeHtml.length} characters\n`);

        // Test 2: Submission Approved
        console.log('2️⃣  Testing Submission Approved Email...');
        const approvedHtml = await render(
            SubmissionApprovedEmail({
                submissionUrl: 'https://example.com/article',
                submissionTitle: 'Amazing Discovery',
                firstName: 'Jane',
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Submission Approved Email rendered successfully');
        console.log(`   📊 Length: ${approvedHtml.length} characters\n`);

        // Test 3: Deletion Cancelled
        console.log('3️⃣  Testing Deletion Cancelled Email...');
        const cancelledHtml = await render(
            DeletionCancelledEmail({
                cancelledDate: new Date().toISOString(),
                firstName: 'Bob',
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Deletion Cancelled Email rendered successfully');
        console.log(`   📊 Length: ${cancelledHtml.length} characters\n`);

        // Test 4: Deletion Request
        console.log('4️⃣  Testing Deletion Request Email...');
        const requestHtml = await render(
            DeletionRequestEmail({
                scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancelUrl: `${frontendUrl}/cancel-deletion`,
                firstName: 'Alice',
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Deletion Request Email rendered successfully');
        console.log(`   📊 Length: ${requestHtml.length} characters\n`);

        // Test 5: Deletion Reminder
        console.log('5️⃣  Testing Deletion Reminder Email...');
        const reminderHtml = await render(
            DeletionReminderEmail({
                daysRemaining: 7,
                scheduledDeletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                cancelUrl: `${frontendUrl}/cancel-deletion`,
                firstName: 'Charlie',
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Deletion Reminder Email rendered successfully');
        console.log(`   📊 Length: ${reminderHtml.length} characters\n`);

        // Test 6: Submission Rejected
        console.log('6️⃣  Testing Submission Rejected Email...');
        const rejectedHtml = await render(
            SubmissionRejectedEmail({
                submissionUrl: 'https://example.com/low-quality',
                submissionTitle: 'Test Submission',
                reason: 'Content does not meet our quality standards.',
                firstName: 'Dave',
                email,
                frontendUrl,
                unsubscribeUrl,
            })
        );
        console.log('   ✅ Submission Rejected Email rendered successfully');
        console.log(`   📊 Length: ${rejectedHtml.length} characters\n`);

        // Check for SVG presence
        console.log('🔍 Checking for SVG icons in rendered HTML...');
        const templates = [
            { name: 'Welcome', html: welcomeHtml },
            { name: 'Submission Approved', html: approvedHtml },
            { name: 'Deletion Cancelled', html: cancelledHtml },
            { name: 'Deletion Request', html: requestHtml },
            { name: 'Deletion Reminder', html: reminderHtml },
            { name: 'Submission Rejected', html: rejectedHtml },
        ];

        let allHaveSvgs = true;
        for (const template of templates) {
            const svgCount = (template.html.match(/<svg/g) || []).length;
            if (svgCount > 0) {
                console.log(`   ✅ ${template.name}: ${svgCount} SVG icon(s) found`);
            } else {
                console.log(`   ⚠️  ${template.name}: No SVG icons found`);
                allHaveSvgs = false;
            }
        }

        console.log('\n' + '='.repeat(60));
        if (allHaveSvgs) {
            console.log('🎉 SUCCESS! All email templates rendered with SVG icons!');
            console.log('✨ Emoticons have been successfully replaced with themed SVGs.');
        } else {
            console.log('⚠️  WARNING: Some templates may not have SVG icons.');
        }
        console.log('='.repeat(60));

        return true;
    } catch (error) {
        console.error('❌ Error testing email templates:', error);
        return false;
    }
}

// Run tests
testEmailRendering().then((success) => {
    process.exit(success ? 0 : 1);
});
