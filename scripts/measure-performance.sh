#!/bin/bash

# Build Performance Measurement Script
# Usage: ./scripts/measure-performance.sh

set -e

echo "========================================"
echo "  Build Performance Measurement"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
RESULTS_DIR="performance-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="$RESULTS_DIR/results-$TIMESTAMP.json"

echo -e "${BLUE}Starting performance measurements...${NC}"
echo ""

# 1. Type Check Time
echo -e "${YELLOW}[1/5] Measuring TypeScript type checking...${NC}"
TYPE_CHECK_START=$(date +%s%N)
pnpm check-types > /dev/null 2>&1 || true
TYPE_CHECK_END=$(date +%s%N)
TYPE_CHECK_TIME=$(( ($TYPE_CHECK_END - $TYPE_CHECK_START) / 1000000 ))
echo -e "${GREEN}✓ Type checking completed in ${TYPE_CHECK_TIME}ms${NC}"
echo ""

# 2. Lint Time
echo -e "${YELLOW}[2/5] Measuring linting...${NC}"
LINT_START=$(date +%s%N)
pnpm lint > /dev/null 2>&1 || true
LINT_END=$(date +%s%N)
LINT_TIME=$(( ($LINT_END - $LINT_START) / 1000000 ))
echo -e "${GREEN}✓ Linting completed in ${LINT_TIME}ms${NC}"
echo ""

# 3. Clean Build (remove cache first)
echo -e "${YELLOW}[3/5] Measuring clean build (with cache cleared)...${NC}"
rm -rf .next node_modules/.cache .tsbuildinfo 2>/dev/null || true
CLEAN_BUILD_START=$(date +%s%N)
pnpm build > /dev/null 2>&1 || true
CLEAN_BUILD_END=$(date +%s%N)
CLEAN_BUILD_TIME=$(( ($CLEAN_BUILD_END - $CLEAN_BUILD_START) / 1000000 ))
echo -e "${GREEN}✓ Clean build completed in ${CLEAN_BUILD_TIME}ms${NC}"
echo ""

# 4. Incremental Build (with cache)
echo -e "${YELLOW}[4/5] Measuring incremental build (with cache)...${NC}"
INCREMENTAL_BUILD_START=$(date +%s%N)
pnpm build > /dev/null 2>&1 || true
INCREMENTAL_BUILD_END=$(date +%s%N)
INCREMENTAL_BUILD_TIME=$(( ($INCREMENTAL_BUILD_END - $INCREMENTAL_BUILD_START) / 1000000 ))
echo -e "${GREEN}✓ Incremental build completed in ${INCREMENTAL_BUILD_TIME}ms${NC}"
echo ""

# 5. Bundle Size Analysis
echo -e "${YELLOW}[5/5] Analyzing bundle size...${NC}"
NEXT_DIR_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
BUNDLE_SIZE=$(du -sh .next/static 2>/dev/null | cut -f1 || echo "N/A")
echo -e "${GREEN}✓ Build directory size: ${NEXT_DIR_SIZE}${NC}"
echo -e "${GREEN}✓ Bundle size: ${BUNDLE_SIZE}${NC}"
echo ""

# Save results to JSON
cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "measurements": {
    "typeCheckTimeMs": $TYPE_CHECK_TIME,
    "lintTimeMs": $LINT_TIME,
    "cleanBuildTimeMs": $CLEAN_BUILD_TIME,
    "incrementalBuildTimeMs": $INCREMENTAL_BUILD_TIME,
    "buildDirSize": "$NEXT_DIR_SIZE",
    "bundleSize": "$BUNDLE_SIZE"
  },
  "improvement": {
    "cacheSpeedup": "$(( $CLEAN_BUILD_TIME - $INCREMENTAL_BUILD_TIME ))ms ($(( ($CLEAN_BUILD_TIME - $INCREMENTAL_BUILD_TIME) * 100 / $CLEAN_BUILD_TIME ))%)"
  }
}
EOF

echo "========================================"
echo -e "${GREEN}  Performance Results Summary${NC}"
echo "========================================"
echo ""
echo "Type Check:         ${TYPE_CHECK_TIME}ms"
echo "Lint:               ${LINT_TIME}ms"
echo "Clean Build:        ${CLEAN_BUILD_TIME}ms"
echo "Incremental Build:  ${INCREMENTAL_BUILD_TIME}ms"
echo "Cache Speedup:      $(( $CLEAN_BUILD_TIME - $INCREMENTAL_BUILD_TIME ))ms ($(( ($CLEAN_BUILD_TIME - $INCREMENTAL_BUILD_TIME) * 100 / $CLEAN_BUILD_TIME ))%)"
echo "Build Dir Size:     ${NEXT_DIR_SIZE}"
echo "Bundle Size:        ${BUNDLE_SIZE}"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

