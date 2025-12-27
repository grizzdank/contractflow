<!-- Generated from nodes.jsonl - edit via: pq edit PQ-xmb -->

# PQ-xmb: Freemium with session-based rate limiting for anonymous users

**Status:** accepted
**Created:** 2025-12-27
**Tags:** #product #architecture

## Context

SOW generation costs money (LLM tokens). We want maximum conversion (no signup friction) but need to prevent abuse and encourage account creation.

## Decision

Implement a **freemium model with session-based rate limiting**:

| Tier | Limit | Tracking |
|------|-------|----------|
| Anonymous | 3/day | localStorage session ID |
| Free account | 10/month | User ID |
| Pro ($19/mo) | Unlimited | User ID |

Anonymous tracking uses a UUID stored in localStorage, sent with each request. Not bulletproof but sufficient deterrent for casual abuse.

## Alternatives Considered

1. **Require signup for any generation** - Rejected: too much friction, kills conversion
2. **IP-based rate limiting only** - Rejected: unreliable (VPNs, shared IPs)
3. **CAPTCHA before generation** - Rejected: friction, bad UX
4. **No limits** - Rejected: LLM costs would spiral

## Consequences

- Most users will hit limit and see "create account for more" prompt
- Sophisticated abuse still possible (clear localStorage) but cost-benefit doesn't justify harder measures
- Usage tracking table (`sow_usage_tracking`) stores session_id + hashed IP for analytics
- Can tighten limits later if abuse detected
