#!/bin/bash

# Rename StupidClicker -> Clickstr across the entire codebase
# Run from the stupid-clicker repo root directory
#
# Usage: ./scripts/rename-to-clickstr.sh
#
# This script will:
# 1. Rename files containing "Stupid" or "stupid"
# 2. Replace text content in all relevant files
# 3. Handle both repos: stupid-clicker and mann-dot-cool

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  StupidClicker -> Clickstr Rename Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Paths
GAME_REPO="/Users/jonathanmann/SongADAO Dropbox/Jonathan Mann/projects/games/stupid-clicker"
API_REPO="/Users/jonathanmann/SongADAO Dropbox/Jonathan Mann/projects/mann-dot-cool"

# Check we're in the right place
if [[ ! -f "$GAME_REPO/contracts/StupidClicker.sol" ]]; then
    echo -e "${RED}Error: Can't find StupidClicker.sol. Are you in the right directory?${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Renaming files in game repo...${NC}"

# Function to safely rename a file
rename_file() {
    local old="$1"
    local new="$2"
    if [[ -f "$old" ]]; then
        echo "  Renaming: $(basename "$old") -> $(basename "$new")"
        mv "$old" "$new"
    fi
}

# Rename contract files
rename_file "$GAME_REPO/contracts/StupidClicker.sol" "$GAME_REPO/contracts/Clickstr.sol"
rename_file "$GAME_REPO/contracts/StupidClickerNFT.sol" "$GAME_REPO/contracts/ClickstrNFT.sol"

# Rename test files
rename_file "$GAME_REPO/test/StupidClicker.test.js" "$GAME_REPO/test/Clickstr.test.js"
rename_file "$GAME_REPO/test/StupidClickerNFT.test.js" "$GAME_REPO/test/ClickstrNFT.test.js"

# Rename subgraph ABI
rename_file "$GAME_REPO/subgraph/abis/StupidClicker.json" "$GAME_REPO/subgraph/abis/Clickstr.json"

# Rename legacy frontend component
rename_file "$GAME_REPO/frontend/StupidClicker.jsx" "$GAME_REPO/frontend/Clickstr.jsx"

echo ""
echo -e "${YELLOW}Step 2: Renaming API files in mann-dot-cool...${NC}"

# Rename API files
rename_file "$API_REPO/api/stupid-clicker.js" "$API_REPO/api/clickstr.js"
rename_file "$API_REPO/api/stupid-clicker-claim-signature.js" "$API_REPO/api/clickstr-claim-signature.js"
rename_file "$API_REPO/api/stupid-clicker-eligible.js" "$API_REPO/api/clickstr-eligible.js"
rename_file "$API_REPO/api/stupid-clicker-admin-reset.js" "$API_REPO/api/clickstr-admin-reset.js"

echo ""
echo -e "${YELLOW}Step 3: Replacing text content in game repo...${NC}"

# Files to process in game repo (excluding node_modules, artifacts, build dirs)
# Using find with -print0 and xargs for safety with spaces in paths

# Replace StupidClicker -> Clickstr (PascalCase)
find "$GAME_REPO" \
    -type f \
    \( -name "*.sol" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.html" -o -name "*.css" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/artifacts/*" \
    ! -path "*/.git/*" \
    ! -path "*/build/*" \
    ! -path "*/generated/*" \
    ! -path "*/cache/*" \
    -print0 | while IFS= read -r -d '' file; do
    if grep -q "StupidClicker" "$file" 2>/dev/null; then
        echo "  Processing: ${file#$GAME_REPO/}"
        # macOS sed requires '' after -i
        sed -i '' 's/StupidClicker/Clickstr/g' "$file"
    fi
done

# Replace stupid-clicker -> clickstr (kebab-case)
find "$GAME_REPO" \
    -type f \
    \( -name "*.sol" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.html" -o -name "*.css" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/artifacts/*" \
    ! -path "*/.git/*" \
    ! -path "*/build/*" \
    ! -path "*/generated/*" \
    ! -path "*/cache/*" \
    -print0 | while IFS= read -r -d '' file; do
    if grep -q "stupid-clicker" "$file" 2>/dev/null; then
        echo "  Processing: ${file#$GAME_REPO/}"
        sed -i '' 's/stupid-clicker/clickstr/g' "$file"
    fi
done

# Replace STUPID_CLICKER -> CLICKSTR (SCREAMING_SNAKE_CASE)
find "$GAME_REPO" \
    -type f \
    \( -name "*.sol" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.html" -o -name "*.css" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/artifacts/*" \
    ! -path "*/.git/*" \
    ! -path "*/build/*" \
    ! -path "*/generated/*" \
    ! -path "*/cache/*" \
    -print0 | while IFS= read -r -d '' file; do
    if grep -q "STUPID_CLICKER" "$file" 2>/dev/null; then
        echo "  Processing: ${file#$GAME_REPO/}"
        sed -i '' 's/STUPID_CLICKER/CLICKSTR/g' "$file"
    fi
done

# Replace "Stupid Clicker" -> "Clickstr" (with space, in docs)
find "$GAME_REPO" \
    -type f \
    \( -name "*.md" -o -name "*.html" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    -print0 | while IFS= read -r -d '' file; do
    if grep -q "Stupid Clicker" "$file" 2>/dev/null; then
        echo "  Processing: ${file#$GAME_REPO/}"
        sed -i '' 's/Stupid Clicker/Clickstr/g' "$file"
    fi
done

echo ""
echo -e "${YELLOW}Step 4: Replacing text content in mann-dot-cool API...${NC}"

# Process API files
find "$API_REPO/api" \
    -type f -name "*.js" \
    -print0 | while IFS= read -r -d '' file; do
    if grep -qE "StupidClicker|stupid-clicker|STUPID_CLICKER" "$file" 2>/dev/null; then
        echo "  Processing: ${file#$API_REPO/}"
        sed -i '' 's/StupidClicker/Clickstr/g' "$file"
        sed -i '' 's/stupid-clicker/clickstr/g' "$file"
        sed -i '' 's/STUPID_CLICKER/CLICKSTR/g' "$file"
    fi
done

echo ""
echo -e "${YELLOW}Step 5: Cleaning up build artifacts...${NC}"

# Remove artifacts that will need to regenerate
if [[ -d "$GAME_REPO/artifacts" ]]; then
    echo "  Removing artifacts/ (will regenerate on compile)"
    rm -rf "$GAME_REPO/artifacts"
fi

if [[ -d "$GAME_REPO/cache" ]]; then
    echo "  Removing cache/"
    rm -rf "$GAME_REPO/cache"
fi

if [[ -d "$GAME_REPO/subgraph/generated" ]]; then
    echo "  Removing subgraph/generated/ (will regenerate on codegen)"
    rm -rf "$GAME_REPO/subgraph/generated"
fi

if [[ -d "$GAME_REPO/subgraph/build" ]]; then
    echo "  Removing subgraph/build/"
    rm -rf "$GAME_REPO/subgraph/build"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rename Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git diff"
echo "2. Compile contracts: npx hardhat compile"
echo "3. Run tests: npx hardhat test"
echo "4. Regenerate subgraph: cd subgraph && npm run codegen"
echo "5. Update Vercel env var: CLICKSTR_ADMIN_SECRET (was STUPID_CLICKER_ADMIN_SECRET)"
echo "6. Decide on Redis key migration (see docs/session-notes.md)"
echo ""
echo -e "${YELLOW}Files renamed:${NC}"
echo "  - contracts/Clickstr.sol"
echo "  - contracts/ClickstrNFT.sol"
echo "  - test/Clickstr.test.js"
echo "  - test/ClickstrNFT.test.js"
echo "  - subgraph/abis/Clickstr.json"
echo "  - frontend/Clickstr.jsx"
echo "  - mann-dot-cool/api/clickstr.js"
echo "  - mann-dot-cool/api/clickstr-claim-signature.js"
echo "  - mann-dot-cool/api/clickstr-eligible.js"
echo "  - mann-dot-cool/api/clickstr-admin-reset.js"
echo ""
echo -e "${RED}IMPORTANT:${NC} Redis keys on mann.cool still use 'stupid-clicker:' prefix."
echo "You need to either:"
echo "  A) Reset all Redis data (ok for testnet)"
echo "  B) Run a migration script to rename keys"
echo ""
