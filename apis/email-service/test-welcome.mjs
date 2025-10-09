import { pretty, render } from '@react-email/render';
import React from 'react';

// Test welcome email
const { WelcomeEmail } = await import('./src/templates/welcome.js');

console.log('Testing WelcomeEmail template...\n');

const testData = {
    email: "test@example.com",
    firstName: "Bryan",
    preferredTopics: ["Technology", "Science"],
    frontendUrl: "https://stumbleable.com",
    unsubscribeUrl: "https://stumbleable.com/unsubscribe"
};

console.log('Test data:', JSON.stringify(testData, null, 2));

try {
    console.log('\nCreating React element...');
    const component = React.createElement(WelcomeEmail, testData);
    console.log('✓ React element created');
    console.log('**************************************************************');
    console.log(component.type);
    console.log('**************************************************************');
    console.log('\nRendering to HTML...');
    const html = await pretty(await render(component));
    console.log('✓ HTML rendered successfully!');
    console.log(`✓ Output length: ${html.length} bytes`);

} catch (error) {
    console.error('\n❌ Rendering failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('\n✅ WelcomeEmail test passed!');
