
# 🚀 NOVIQ Mainnet Deployment Checklist

Generated: 2025-12-07T00:39:55.720Z

## Pre-Deployment
- [x] Environment configured for mainnet
- [x] No secrets in source code
- [ ] Database schemas deployed to Supabase
- [ ] RPC endpoint tested and working

## Deployment
- [ ] Run `npm run build` successfully
- [ ] Deploy with `vercel --prod`
- [ ] Verify deployment at https://noviq.fun

## Post-Deployment
- [ ] Test simple payment creation
- [ ] Test escrow creation
- [ ] Test split payment creation
- [ ] Test goal creation
- [ ] Verify wallet connection works
- [ ] Check /status page
- [ ] Monitor for errors

## Mainnet Testing (Use small amounts!)
- [ ] Create 0.01 SOL payment
- [ ] Complete payment flow
- [ ] Verify auto-forwarding
- [ ] Check fee collection
