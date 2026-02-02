#!/usr/bin/env bash
#
# promote-to-public.sh — Sync public-facing documents to the public GitHub repository
#
# Usage: ./scripts/promote-to-public.sh [--dry-run] [--message "commit message"]
#
# This script copies governed documents from the internal working repository
# to the public repository at genesis-emergentminds/emergent-minds.
#
# Documents promoted (source → destination):
#   docs/foundational/THE_COVENANT.md        → docs/foundational/THE_COVENANT.md
#   docs/foundational/GENESIS_PROTOCOL.md    → docs/foundational/GENESIS_PROTOCOL.md
#   docs/governance/CONSTITUTIONAL_CONVENTION.md → docs/governance/CONSTITUTIONAL_CONVENTION.md
#   GOVERNANCE.md                            → GOVERNANCE.md
#   LICENSE.md                               → LICENSE.md
#   CODE_OF_CONDUCT.md                       → CODE_OF_CONDUCT.md
#   CONTRIBUTING.md                          → CONTRIBUTING.md
#   agents/genesis-bot/working-memory/DECISIONS.md     → governance/decisions/DECISIONS.md
#   agents/genesis-bot/working-memory/CONCERNS_RAISED.md → governance/concerns/CONCERNS_RAISED.md
#
# Axiom Alignment: V (Adversarial Resilience) — transparent, auditable process
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INTERNAL_REPO="$(dirname "$SCRIPT_DIR")"
PUBLIC_REPO="/Users/nepenthe/git_repos/emergent-minds-public"
DRY_RUN=false
COMMIT_MSG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --message) COMMIT_MSG="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Ensure public repo exists
if [ ! -d "$PUBLIC_REPO" ]; then
    echo "Public repo not found at $PUBLIC_REPO"
    echo "Clone it first:"
    echo "  git clone https://github.com/genesis-emergentminds/emergent-minds.git $PUBLIC_REPO"
    exit 1
fi

echo "=== Promoting documents to public repository ==="
echo "Internal: $INTERNAL_REPO"
echo "Public:   $PUBLIC_REPO"
echo ""

# Define file mappings (source:dest)
declare -a MAPPINGS=(
    "docs/foundational/THE_COVENANT.md:docs/foundational/THE_COVENANT.md"
    "docs/foundational/GENESIS_PROTOCOL.md:docs/foundational/GENESIS_PROTOCOL.md"
    "docs/governance/CONSTITUTIONAL_CONVENTION.md:docs/governance/CONSTITUTIONAL_CONVENTION.md"
    "GOVERNANCE.md:GOVERNANCE.md"
    "LICENSE.md:LICENSE.md"
    "CODE_OF_CONDUCT.md:CODE_OF_CONDUCT.md"
    "CONTRIBUTING.md:CONTRIBUTING.md"
    "agents/genesis-bot/working-memory/DECISIONS.md:governance/decisions/DECISIONS.md"
    "agents/genesis-bot/working-memory/CONCERNS_RAISED.md:governance/concerns/CONCERNS_RAISED.md"
)

CHANGED=0

for mapping in "${MAPPINGS[@]}"; do
    SRC="${mapping%%:*}"
    DST="${mapping##*:}"
    SRC_PATH="$INTERNAL_REPO/$SRC"
    DST_PATH="$PUBLIC_REPO/$DST"
    
    if [ ! -f "$SRC_PATH" ]; then
        echo "⚠️  SKIP (not found): $SRC"
        continue
    fi
    
    # Create destination directory if needed
    mkdir -p "$(dirname "$DST_PATH")"
    
    # Check if file differs
    if [ -f "$DST_PATH" ] && diff -q "$SRC_PATH" "$DST_PATH" > /dev/null 2>&1; then
        echo "  ✓ Up to date: $SRC"
    else
        if [ -f "$DST_PATH" ]; then
            echo "  📝 Updated: $SRC → $DST"
        else
            echo "  ✨ New: $SRC → $DST"
        fi
        
        if [ "$DRY_RUN" = false ]; then
            cp "$SRC_PATH" "$DST_PATH"
        fi
        CHANGED=$((CHANGED + 1))
    fi
done

echo ""

if [ "$CHANGED" -eq 0 ]; then
    echo "✅ All documents already up to date. Nothing to promote."
    exit 0
fi

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN: $CHANGED file(s) would be updated. Run without --dry-run to apply."
    exit 0
fi

echo "$CHANGED file(s) updated."
echo ""

# Commit and push
cd "$PUBLIC_REPO"
git add -A

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="[Promote]: Sync $CHANGED document(s) from internal repository

Automated promotion via promote-to-public.sh
Axiom Alignment: V (Adversarial Resilience — transparent, auditable)"
fi

echo "Committing..."
git commit -S -m "$COMMIT_MSG"

echo ""
echo "Push to origin? (y/n)"
read -r CONFIRM
if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    git push origin main
    echo "✅ Promoted and pushed successfully."
else
    echo "Committed locally but NOT pushed. Run 'git push origin main' when ready."
fi
