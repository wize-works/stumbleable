import { render } from '@react-email/render';
import React from 'react';

// Dynamically import the template
const { SubmissionApprovedEmail } = await import('./src/templates/submission-approved.js');

console.log('Testing template rendering...\n');

const testData = {
    email: "test@example.com",
    firstName: "Bryan",
    submissionUrl: "https://example.com",
    submissionTitle: "Test Submission",
    frontendUrl: "https://stumbleable.com",
    unsubscribeUrl: "https://stumbleable.com/unsubscribe"
};

console.log('Test data:', JSON.stringify(testData, null, 2));

try {
    console.log('\nCreating React element...');
    const component = React.createElement(SubmissionApprovedEmail, testData);
    console.log('✓ React element created');

    console.log('\nRendering to HTML...');
    const html = await render(component, { pretty: false });
    console.log('✓ HTML rendered successfully!');
    console.log(`✓ Output length: ${html.length} bytes`);

    // Show first 500 chars
    console.log('\nFirst 500 characters of output:');
    console.log(html.substring(0, 500) + '...');

} catch (error) {
    console.error('\n❌ Rendering failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('\n✅ Test passed!');
