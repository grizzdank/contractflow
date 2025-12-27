<!-- Generated from nodes.jsonl - edit via: pq edit PQ-7wx -->

# PQ-7wx: SOW Generator as standalone wedge product

**Status:** accepted
**Created:** 2025-12-27
**Tags:** #product #strategy

## Context

ContractFlow is a full CLM (Contract Lifecycle Management) platform competing in a crowded market with high switching costs. The e-signature feature (DocuSeal) is table stakes - every competitor has it. We needed a differentiated path to revenue that doesn't require users to migrate their entire contract workflow.

## Decision

Build the AI SOW Generator as a **standalone public tool** at `/sow-generator` that can be used without an account. This is a "wedge product" strategy:
- Minimal friction entry (no signup to try)
- Solves a real pain point (writing SOWs is tedious)
- Differentiator (few tools do AI SOW generation well)
- Upsell path to full CLM once users see value

## Alternatives Considered

1. **Build SOW as CLM-only feature** - Rejected: requires full onboarding, high friction
2. **Separate domain/brand** - Rejected: lose brand leverage, more infrastructure
3. **Prioritize e-signatures first** - Rejected: commodity feature, no differentiation

## Consequences

- SOW Generator can drive traffic independently via SEO/marketing
- Revenue possible before full CLM is production-ready
- Must maintain two "products" (standalone SOW + full CLM)
- Conversion funnel: Anonymous → Free account (save SOWs) → Pro ($19/mo) → CLM
