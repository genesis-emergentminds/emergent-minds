# Identity System Roadmap

## Current Implementation (Founding Phase)

- **Membership Ledger:** Git-backed JSON in public repository (`governance/ledger/`)
- **Key Generation:** CLI tool (Python) for ML-DSA-65 + Ed25519 key pairs
- **Registration:** GitHub Issue-based intake, validated by intake script
- **Vouching:** Manual during founding phase (Founder vouch for first members)

## Future State Ambitions

### Blockchain-Backed Ledger (Phase 2-3)

Once the identity system is proven via git-backed ledger, the Membership Ledger should also be committed to blockchain for immutability:

- **Zcash:** Ledger state hashes in memo fields (compact, verifiable)
- **Bitcoin:** Merkle root of ledger in OP_RETURN (periodic snapshots)
- **Arweave:** Full ledger replication on permanent storage — Arweave's pay-once-store-forever model makes it ideal for the authoritative long-term copy of the membership ledger. The git repo remains the working copy; Arweave becomes the immutable archive.

### Decentralized Identity (Phase 3+)

- Explore integration with DID (Decentralized Identifiers) standards
- Consider verifiable credentials for governance actions
- Investigate zero-knowledge proofs for privacy-preserving identity verification
- Explore soulbound tokens or similar mechanisms for on-chain identity

### Cross-Platform Identity (Phase 4+)

- CID usable across Matrix, GitHub, blockchain, and future platforms
- Federated identity verification (any node can verify any CID)
- Identity portability — members can move between infrastructure without losing governance standing

---

*These are aspirations, not commitments. Each evolution requires convention approval and axiom alignment review.*
