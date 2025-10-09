import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not set. Email sending will be simulated.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@updates.stumbleable.com';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Stumbleable';
export const EMAIL_FROM = `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const UNSUBSCRIBE_URL = process.env.UNSUBSCRIBE_URL || `${FRONTEND_URL}/email/unsubscribe`;
