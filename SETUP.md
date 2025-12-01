# Setup Guide - x402 Banana Playground with MNEE

Quick setup guide for the MNEE Hackathon project.

## Prerequisites

- [Bun](https://bun.sh/) or Node.js 18+
- [Supabase](https://supabase.com/) account
- Ethereum wallet (MetaMask recommended)
- MNEE tokens on Sepolia testnet

## Step 1: Clone & Install

```bash
git clone https://github.com/fozagtx/x402-banana.git
cd payments
bun install
```

## Step 2: Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Go to SQL Editor and run the migrations:
   - Run `supabase/migrations/20251124062721_create_prompt_presets_table.sql`
   - Run `supabase/migrations/20251201_create_agent_api_keys_table.sql`

## Step 3: Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTreasuryWallet
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=35b2b2c483040280c0514801f2ff81de
```

**Important:** Set `NEXT_PUBLIC_TREASURY_ADDRESS` to your Ethereum wallet where you want to receive MNEE payments.

## Step 4: Run Development Server

```bash
bun dev
```

Visit:
- Main app: http://localhost:3000
- Agent dashboard: http://localhost:3000/agent/dashboard
- API docs: http://localhost:3000/agent/docs

## Step 5: Get MNEE Tokens (Testnet)

1. Switch your wallet to Sepolia testnet
2. Get Sepolia ETH from faucet: https://sepoliafaucet.com
3. Get MNEE tokens from MNEE faucet (check hackathon docs)

## Step 6: Test the Application

### As a Human User:
1. Go to http://localhost:3000
2. Click "CONNECT WALLET"
3. Enter a prompt
4. Click "GENERATE"
5. Approve the payment transaction

### As an AI Agent:
1. Go to http://localhost:3000/agent/dashboard
2. Connect your wallet
3. Click "GENERATE" to create an API key
4. Copy the API key
5. Use the API (see HACKATHON.md for code examples)

## Troubleshooting

### "Transaction failed" error
- Ensure you have enough MNEE tokens (0.15 MNEE)
- Check you have Sepolia ETH for gas

### "Invalid API key" error
- Verify API key is correct
- Check API key is active in dashboard

### Database errors
- Verify Supabase migrations are applied
- Check Supabase connection in .env.local

### Payment verification failed
- Ensure NEXT_PUBLIC_TREASURY_ADDRESS is set correctly
- Verify transaction hash is valid
- Check transaction is on Sepolia network

## Production Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Deploy production
vercel --prod
```

### Environment Variables for Production
Set these in your Vercel/Netlify dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TREASURY_ADDRESS`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`

## API Testing with cURL

```bash
# First, make a payment transaction and get the tx hash

# Then call the API
curl -X POST http://localhost:3000/api/agent/generate \
  -H "Authorization: Bearer mnee_agent_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A banana on a skateboard",
    "payment_tx_hash": "0xYourTxHash",
    "wallet_address": "0xYourWallet"
  }'
```

## Need Help?

- Check [HACKATHON.md](./HACKATHON.md) for detailed documentation
- Visit `/agent/docs` for API documentation
- Review error messages in browser console
- Check Supabase logs for database issues

## Contract Addresses

- **MNEE Token**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111

---

**Ready to build!** 🚀