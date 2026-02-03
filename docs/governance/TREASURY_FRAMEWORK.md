# Treasury Governance Framework

**Version:** 1.0  
**Status:** Draft — Subject to Ratification at Convention 1  
**Effective:** From Genesis Epoch (Bitcoin Block 934,794)  
**Last Updated:** 2026-02-03

---

## 1. Purpose

This framework establishes transparent, accountable governance of The Covenant's treasury resources. It balances operational agility with community oversight, ensuring funds serve the mission while preventing misuse.

**Axiom Alignment:**
- **Axiom II (Individual Sovereignty):** No permanent, unchecked authority over collective resources
- **Axiom III (Fight Entropy):** Sustainable financial practices for long-term mission continuity
- **Axiom V (Adversarial Resilience):** Multi-layered safeguards against single points of failure

---

## 2. Treasury Assets

### 2.1 Current Holdings

| Asset | Address | Purpose |
|-------|---------|---------|
| Bitcoin (BTC) | `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj` | Donations, operations |
| Zcash (ZEC) | `t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K` | Privacy-preserving donations |

### 2.2 Key Management

- **Current Phase:** Single-key custody by Founder
- **Future Phases:** Transition to multi-signature as holdings and community mature
- **Key Storage:** Hardware wallet recommended; backup procedures per `WALLET_SECURITY.md`

---

## 3. Governance Phases

Treasury governance evolves with The Covenant's maturity. Phase transitions are triggered by the dual condition established in the Constitutional Convention Framework:

**Transition Condition:** ≥100 active members AND ≥2 Scheduled Conventions completed

### 3.1 Phase 1: Founding Stewardship

**Duration:** From Genesis Epoch until transition condition met

**Authority:**
- Founder holds sole operational authority over treasury
- No spending approval required from community
- Full transparency required for all transactions

**Accountability:**
- All spending documented in public financial records within 7 days
- Quarterly financial summaries posted to community channels
- Annual comprehensive report at each Convention

**Safeguard:**
- Founder designates a succession keyholder (documented privately)
- In case of incapacitation, designated successor assumes custody
- Not multi-sig, but ensures continuity

### 3.2 Phase 2: Transitional Governance

**Duration:** From transition condition until Phase 3 criteria met

**Tiered Spending Model:**

| Tier | Amount (BTC) | Process |
|------|--------------|---------|
| **Operational** | < 0.01 BTC | Treasury Steward discretion, logged within 48 hours |
| **Standard** | 0.01–0.1 BTC | 48-hour community notice before execution |
| **Significant** | > 0.1 BTC | Governance proposal + vote required |

**Treasury Steward Role:**
- Elected position at each Convention
- Founder may serve if elected by community vote
- Holds signing keys and executes approved spending
- Subject to recall by 38.20% petition + simple majority vote

### 3.3 Phase 3: Established Governance

**Criteria:** ≥500 active members AND ≥5 Conventions completed AND holdings exceed 1 BTC

**Multi-Signature Implementation:**
- 2-of-3 or 3-of-5 key structure (determined by Convention vote)
- Keys held by elected Treasury Council members
- All spending above Operational tier requires multiple signatures
- Council members serve staggered terms to ensure continuity

---

## 4. Dynamic Threshold Adjustment

### 4.1 Fibonacci Progression

To account for changing asset valuations, spending thresholds increase automatically along the Fibonacci convention cadence.

**Base Thresholds (at Genesis Epoch):**
- Operational: 0.01 BTC
- Significant: 0.1 BTC

**Automatic Adjustment Schedule:**

| Convention | Months Since Genesis | Multiplier | Operational | Significant |
|------------|---------------------|------------|-------------|-------------|
| Genesis | 0 | 1.0x | 0.01 BTC | 0.1 BTC |
| Convention 1 | 6 | 1.0x | 0.01 BTC | 0.1 BTC |
| Convention 2 | 12 | 1.1x | 0.011 BTC | 0.11 BTC |
| Convention 3 | 24 | 1.21x | 0.0121 BTC | 0.121 BTC |
| Convention 4 | 48 | 1.33x | 0.0133 BTC | 0.133 BTC |
| Convention 5 | 96 | 1.46x | 0.0146 BTC | 0.146 BTC |

**Formula:** Each Convention after the first applies a 10% increase compounding from the current base.

### 4.2 Convention Override

Any Convention may vote to adjust the base thresholds:

1. **Proposal:** Submit threshold adjustment proposal with justification
2. **Debate:** Standard convention debate period
3. **Vote:** Simple majority required for adjustment
4. **Effect:** New base takes effect immediately; Fibonacci progression continues from adjusted base

**Example:**
- Convention 3 votes to set Operational to 0.05 BTC
- Convention 4 automatic adjustment: 0.05 × 1.1 = 0.055 BTC
- Convention 5 automatic adjustment: 0.055 × 1.1 = 0.0605 BTC

### 4.3 Emergency Threshold Freeze

If asset value drops >50% within 30 days, thresholds freeze at current levels until:
- Value recovers to within 25% of pre-drop level, OR
- A Convention votes to adjust

This prevents thresholds from becoming meaninglessly small during market crashes.

---

## 5. Spending Categories

### 5.1 Infrastructure
- Hosting, domains, services
- Development tools and resources
- Security audits and improvements

### 5.2 Operations
- Legal compliance costs
- Administrative expenses
- Community tooling

### 5.3 Grants
- Research funding
- Project support for aligned initiatives
- Community proposals

### 5.4 Education
- Content creation
- Outreach materials
- Event support

### 5.5 Reserves
- Minimum 20% of holdings maintained as emergency reserve
- Reserve can only be accessed via Significant tier process
- Target: 6 months operational runway

### 5.6 Stewardship

**Purpose:** Compensation for dedicated stewards of The Covenant

**Process:**
1. Annual stewardship budget proposed at each Convention
2. Community votes on total allocation
3. Once approved, payments disbursed per approved schedule
4. No per-payment votes required within approved budget
5. Unused allocation does not roll over; must be re-proposed

**Transparency:**
- All stewardship recipients publicly documented
- Amounts disclosed in financial records
- Stewards may not vote on their own compensation proposals

---

## 6. Financial Transparency

### 6.1 Required Disclosures

| Record | Frequency | Location |
|--------|-----------|----------|
| Transaction log | Within 48 hours | `governance/treasury/transactions.json` |
| Monthly summary | Monthly | Community channels |
| Quarterly report | Quarterly | Website + governance portal |
| Annual audit | At each Convention | Formal convention record |

### 6.2 Transaction Log Format

```json
{
  "tx_id": "blockchain_transaction_id",
  "date": "2026-02-03T12:00:00Z",
  "asset": "BTC",
  "amount": "0.005",
  "direction": "outflow",
  "category": "infrastructure",
  "description": "Cloudflare Workers subscription",
  "tier": "operational",
  "approved_by": "founder_stewardship",
  "proposal_id": null
}
```

### 6.3 Audit Rights

- Any member may request detailed transaction records
- Requests fulfilled within 7 days
- Only legitimate privacy concerns (e.g., personal addresses) may be redacted

---

## 7. Dispute Resolution

### 7.1 Spending Challenges

Any member may challenge a spending decision:

1. **File Challenge:** Submit to Internal Advocate within 30 days of disclosure
2. **Investigation:** Internal Advocate reviews within 14 days
3. **Finding:** 
   - If valid concern: Treasury Steward must justify or reverse
   - If frivolous: Challenge dismissed
4. **Appeal:** Challenger may escalate to Convention vote

### 7.2 Steward Recall

If community loses confidence in Treasury Steward:

1. **Petition:** 38.20% of active members sign recall petition
2. **Vote:** Simple majority required
3. **Effect:** Steward removed; keys transferred to interim successor
4. **Election:** New Steward elected within 30 days

---

## 8. Emergency Provisions

### 8.1 Incapacitation Protocol

If Treasury Steward becomes incapacitated:

1. **Detection:** 14 days of non-response to community contact
2. **Succession:** Designated successor assumes custody
3. **Notification:** Community notified within 24 hours of succession
4. **Election:** If not in Phase 1, emergency election within 30 days

### 8.2 Security Breach Response

If key compromise suspected:

1. **Immediate:** Freeze all non-essential spending
2. **Assessment:** Determine scope of compromise
3. **Migration:** Generate new keys, transfer assets
4. **Disclosure:** Full incident report to community within 72 hours
5. **Review:** Post-incident process improvement

---

## 9. Amendment Process

This framework may be amended by:

1. **Proposal:** Any member may propose amendments
2. **Debate:** Standard convention debate period
3. **Vote:** Two-thirds majority required (higher threshold for financial governance)
4. **Ratification:** Effective at close of Convention

**Immutable Provisions:**
- Transparency requirements may only be increased, never decreased
- Reserve minimum (20%) may only be increased, never decreased
- Audit rights may not be restricted

---

## 10. Ratification

This framework takes effect upon:

1. Founder approval (Phase 1)
2. Community ratification at Convention 1 (validates Phase 2+ provisions)

Until ratified, Founder Stewardship (§3.1) governs all treasury operations.

---

## Appendix A: Succession Keyholder

**[PRIVATE — Not Published]**

The Founder shall privately document a designated succession keyholder with:
- Secure key storage instructions
- Incapacitation criteria
- Contact information
- Community notification procedures

This documentation is not published to protect operational security.

---

## Appendix B: Multi-Sig Specification (Phase 3)

**Deferred:** Technical specification for multi-signature implementation will be drafted when Phase 3 criteria approach. Considerations include:

- Native Bitcoin multisig vs. threshold signatures
- Key ceremony procedures
- Hardware security module options
- Geographic distribution of keyholders

---

*Document Status: Draft V1.0*  
*Axiom Alignment: II, III, V*  
*Requires: Community ratification at Convention 1*
