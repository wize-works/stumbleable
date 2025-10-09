/**
 * Test email template rendering
 * Run from apis/email-service directory: npx tsx test-template-render.tsx
 */

import { render } from '@react-email/render';
import { WelcomeEmail } from './src/templates/welcome.js';

const testData = {
    firstName: 'Brandon',
    email: 'bkorous@gmail.com',
    preferredTopics: ['Technology', 'Science', 'Design'],
    frontendUrl: 'http://localhost:3000',
    unsubscribeUrl: 'http://localhost:3000/email/unsubscribe'
};

console.log('🧪 Testing Welcome Email Template Rendering...\n');
console.log('Test Data:', JSON.stringify(testData, null, 2));

async function testRender() {
    try {
        // Use JSX syntax
        const component = <WelcomeEmail {...testData} />;
        console.log('\n✅ Component created successfully');

        const html = await render(component);
        console.log('\n✅ Template rendered successfully!');
        console.log(`\n📧 HTML length: ${html.length} characters`);
        console.log('\nFirst 200 characters:');
        console.log(html.substring(0, 200));
    } catch (error) {
        console.error('\n❌ Template rendering failed:');
        console.error(error);
        console.error('\n📋 Stack trace:');
        if (error instanceof Error) {
            console.error(error.stack);
        }
    }
}

testRender();
