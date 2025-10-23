/**
 * Quick Email Service Test - Welcome Email
 * Run this after starting the email service manually
 */

const testEmail = {
    userId: '360043f4-91d9-4a85-9502-1b1e9039ff6a', // Real user ID from database
    emailType: 'welcome',
    recipientEmail: 'bryan@wize.works',
    templateData: {
        userName: 'Bryan'
    }
};

async function sendTestEmail() {
    try {
        console.log('📧 Sending welcome email test...\n');
        console.log('To:', testEmail.recipientEmail);
        console.log('Type:', testEmail.emailType);
        console.log('User ID:', testEmail.userId);
        console.log('\nPayload:', JSON.stringify(testEmail, null, 2));

        const response = await fetch('http://localhost:7006/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testEmail)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('\n✅ SUCCESS!');
            console.log('Email ID:', result.emailId);
            console.log('\n📬 Email queued! Check your inbox in a moment.');
            console.log('(Also check spam folder if you don\'t see it)');
            console.log('\n⏱️  The background processor runs every 60 seconds.');
            console.log('💡 Watch the email service logs to see it being sent.');
        } else {
            console.log('\n❌ FAILED');
            console.error(result);
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\n💡 Make sure the email service is running on port 7006');
        console.log('   Try: cd apis/email-service && npm run dev');
    }
}

sendTestEmail();
