import { Html, Text } from '@react-email/components';
import { render } from '@react-email/render';
import * as React from 'react';


// Minimal test component
type TestEmailProps = { name: string };


const TestEmail = () => {
    React.version;
    return (
        <Html>
            <Text>Hello!</Text>
        </Html>
    );
}

console.log('Testing minimal component...\n');
console.log('React version:', React.version);

try {
    console.log('Creating element with React.createElement...');
    const element = React.createElement(TestEmail);
    console.log('Element created:', element);
    console.log('Element type:', typeof element);
    console.log('Element keys:', Object.keys(element));

    console.log('\nCalling render...');
    const html = await render(element);

    console.log('✅ Success! HTML length:', html.length);
    console.log('First 200 chars:', html.substring(0, 200));
} catch (error: unknown) {
    if (error instanceof Error) {
        console.error('❌ Failed:', error.message);
        console.error('Stack:', error.stack);
    } else {
        console.error('❌ Failed:', String(error));
    }
    process.exit(1);
}
