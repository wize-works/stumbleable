/**
 * Test email template rendering
 * This helps debug template rendering issues
 */

import { render } from '@react-email/render';
import React from 'react';
import WelcomeEmail from './apis/email-service/src/templates/welcome.js';

const testData = {
    firstName: 'Bryan',
    email: 'bkorous@gmail.com',
    preferredTopics: ['Technology', 'Science', 'Design'],
    frontendUrl: 'http://localhost:3000',
    unsubscribeUrl: 'http://localhost:3000/email/unsubscribe'
};

console.log('🧪 Testing Welcome Email Template Rendering...\n');
console.log('Test Data:', JSON.stringify(testData, null, 2));

try {
    const component = React.createElement(WelcomeEmail, testData);
    console.log('\n✅ Component created successfully');

    const html = await render(component, { pretty: false });
    console.log('\n✅ Template rendered successfully!');
    console.log(`\n📧 HTML length: ${html.length} characters`);
    console.log('\nFirst 200 characters:');
    console.log(html.substring(0, 200));
} catch (error) {
    console.error('\n❌ Template rendering failed:');
    console.error(error);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
}
