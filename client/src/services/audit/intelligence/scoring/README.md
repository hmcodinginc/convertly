# Convertly Scoring — Calibrated Hybrid Growth Model (CHGM)

Engine version: **Intelligence v3**

## Philosophy

Convertly scores communicate **growth readiness**, not perfection.

1. **Category scores** deduct penalty units from optimistic baselines (conversion, trust, mobile, UX).
2. **Growth Score** is a weighted rollup (38% / 28% / 18% / 16%).
3. **Blocker rules** cap the maximum achievable Growth Score until foundation issues are resolved.
4. **Rule influence** is metadata-driven: impact level, rule family, page importance, confidence.
5. **Ceilings stay below 100** — excellent sites top out at 94.

## Module map

| Module | Responsibility |
|--------|----------------|
| `scoringPolicy.ts` | Constants, category budgets, blocker tiers, impact multipliers |
| `ruleScoringMetadata.ts` | Rule Metadata V2 extensions (family, blockers, foundation flags) |
| `blockerCeilingResolver.ts` | Resolves Growth Score ceiling from active blockers |
| `scoringEngineV3.ts` | Core calibrated hybrid scorer |
| `auditConfidence.ts` | Audit completeness / reliability score |
| `growthPotential.ts` | Estimated score after fixing detected issues |
| `scoringEngineV2.ts` | Backward-compatible bridge to V3 |

## Persistence (backward compatible)

V3 auxiliary metrics reuse legacy `audit_score_category` enum values:

| Category | Label |
|----------|-------|
| `clarity` | Audit Confidence |
| `overall` | Growth Potential |
| `friction` | Score Ceiling |

Existing audits without these rows continue to work; UI fields are optional.

## Adding rules at scale (100+)

1. Add entry to `RULE_METADATA` in `ruleMetadata.ts`.
2. Add detector in `pageDetectors.ts` or `siteDetectors.ts`.
3. Optionally extend `BLOCKER_RULE_OVERRIDES` or `RULE_FAMILY_OVERRIDES` in `ruleScoringMetadata.ts`.
4. Assign pack in `rulePacks.ts`.

No scoring engine changes required for standard rules.
