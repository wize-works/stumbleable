# my-app


SaaS starter using Next.js 15, DaisyUI, Clerk auth, and Stripe subscriptions.


## Dev
1. Copy `.env.local` from `_dot_env.local.example` and fill keys
2. `pnpm i` and `pnpm dev`
3. In Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`


## Deploy notes
- Set all env vars in your host
- Add the webhook endpoint URL in Stripe Dashboard
- Configure Clerk Allowed Origins & redirect URLs