# Testing Phase 1: Foundation & Quick Wins
**AI Agent Implementation Guide**

## Overview
Phase 1 establishes a reliable testing foundation by fixing immediate issues and revealing true test coverage. This phase is **prerequisite** for all future testing improvements.

**Goal**: Transform from 9.11% reported coverage to 60-70% true coverage visibility  
**Duration**: Complete all tasks in sequence  
**Success Criteria**: All tests passing + E2E coverage instrumented + baseline documented

---

## User Story 1: Fix Failing Test
**As a** developer  
**I want** all tests to pass  
**So that** the test suite is trustworthy and CI is green

### Context
- Current state: 1 failing test in `src/lib/ai/models.test.ts`
- Test expects `supportedFileMimeTypes` but receives `undefined`
- This blocks all other improvements (broken windows theory)

### Tasks

#### Task 1.1: Investigate Test Failure
**Objective**: Understand why the test is failing

**Steps**:
1. Run the failing test in isolation:
```bash
pnpm test src/lib/ai/models.test.ts
```

2. Examine the test file:
```bash
cat src/lib/ai/models.test.ts | grep -A 20 "supportedFileMimeTypes"
```

3. Check the implementation being tested:
```bash
# Find the function that should return metadata
rg "supportedFileMimeTypes" src/lib/ai --type ts
```

4. Document findings in investigation notes

**Expected Output**: Clear understanding of the mismatch between test expectation and implementation

**Acceptance Criteria**:
- [ ] Know which function/method is being tested
- [ ] Understand what the test expects vs what it gets
- [ ] Identify if this is an implementation bug or test bug

#### Task 1.2: Fix the Test or Implementation
**Objective**: Make the test pass

**Decision Tree**:

**If implementation is wrong**:
1. View the implementation file
2. Add the missing `supportedFileMimeTypes` field to the metadata
3. Ensure it returns the expected MIME types array
4. Run test to verify fix

**If test expectation is wrong**:
1. Check if behavior changed intentionally (git log)
2. Update test expectations to match new behavior
3. Add comment explaining why expectations changed
4. Run test to verify fix

**If feature was intentionally removed**:
1. Remove or skip the test
2. Add comment explaining removal reason
3. Verify other tests still pass

**Commands**:
```bash
# After making changes
pnpm test src/lib/ai/models.test.ts

# Verify all tests pass
pnpm test
```

**Acceptance Criteria**:
- [ ] Test passes successfully
- [ ] No other tests broken by the fix
- [ ] Code change is minimal and focused
- [ ] Added comment if behavior changed intentionally

#### Task 1.3: Commit the Fix
**Objective**: Save the fix to version control

**Steps**:
```bash
# Stage the changes
git add src/lib/ai/models.test.ts
# And any implementation files changed

# Commit with clear message
git commit -m "fix(tests): resolve failing models.test.ts supportedFileMimeTypes assertion

- Fixed [describe what was fixed]
- Test now passes successfully
- Resolves prerequisite for Phase 1 testing improvements"

# Verify commit
git log -1 --stat
```

**Acceptance Criteria**:
- [ ] Changes committed with descriptive message
- [ ] Commit includes both test and implementation changes if both modified
- [ ] Can verify fix by checking out commit and running tests

---

## User Story 2: Install E2E Coverage Tooling
**As a** developer  
**I want** E2E tests to report code coverage  
**So that** I can see which code paths are actually tested

### Context
- Current: E2E tests run but don't contribute to coverage metrics
- Problem: Can't prove E2E tests cover the application
- Solution: Instrument Next.js app to collect coverage during E2E runs

### Tasks

#### Task 2.1: Install Coverage Dependencies
**Objective**: Add required npm packages

**Steps**:
```bash
# Install coverage tooling
pnpm add -D @vitest/coverage-v8@3.2.4 nyc @istanbuljs/nyc-config-typescript

# Verify installation
pnpm list @vitest/coverage-v8 nyc @istanbuljs/nyc-config-typescript
```

**Acceptance Criteria**:
- [ ] All three packages installed successfully
- [ ] No peer dependency warnings
- [ ] package.json updated with new devDependencies

#### Task 2.2: Configure NYC Coverage Tool
**Objective**: Set up coverage collection configuration

**Steps**:
1. Create `.nycrc.json` in project root:
```bash
cat > .nycrc.json << 'NYCEOF'
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.d.ts",
    "**/node_modules/**",
    "**/tests/**",
    "**/.next/**"
  ],
  "reporter": [
    "html",
    "lcov",
    "text-summary",
    "json"
  ],
  "report-dir": "./coverage",
  "temp-dir": "./.nyc_output"
}
NYCEOF
```

2. Verify file created:
```bash
cat .nycrc.json
```

**Acceptance Criteria**:
- [ ] .nycrc.json file exists
- [ ] Configuration includes correct include/exclude patterns
- [ ] Multiple reporters configured for flexibility

#### Task 2.3: Add Coverage Merge Script
**Objective**: Create script to merge Vitest + Playwright coverage

**Steps**:
1. Create merge script:
```bash
cat > scripts/merge-coverage.ts << 'MERGEEOF'
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Merges coverage reports from Vitest (unit/integration) and Playwright (E2E)
 * Generates combined HTML report
 */

async function mergeCoverage() {
  console.log('🔄 Merging coverage reports...');

  const coverageDir = path.join(process.cwd(), 'coverage');
  const vitestCoverage = path.join(coverageDir, 'coverage-vitest.json');
  const playwrightCoverage = path.join(coverageDir, 'coverage-playwright.json');
  
  // Check if coverage files exist
  const hasVitest = fs.existsSync(vitestCoverage);
  const hasPlaywright = fs.existsSync(playwrightCoverage);

  if (!hasVitest && !hasPlaywright) {
    console.error('❌ No coverage files found to merge');
    process.exit(1);
  }

  console.log(`📊 Found coverage files:`);
  if (hasVitest) console.log('  ✓ Vitest coverage');
  if (hasPlaywright) console.log('  ✓ Playwright coverage');

  try {
    // Use NYC to merge and generate reports
    execSync('nyc merge coverage .nyc_output/merged-coverage.json', {
      stdio: 'inherit'
    });

    execSync('nyc report --reporter=html --reporter=text-summary --reporter=lcov', {
      stdio: 'inherit'
    });

    console.log('✅ Coverage merge complete!');
    console.log('📁 View HTML report: coverage/index.html');
  } catch (error) {
    console.error('❌ Coverage merge failed:', error);
    process.exit(1);
  }
}

mergeCoverage();
MERGEEOF
```

2. Make script executable:
```bash
chmod +x scripts/merge-coverage.ts
```

**Acceptance Criteria**:
- [ ] Script file created in scripts/merge-coverage.ts
- [ ] Script has proper error handling
- [ ] Script executable and can be run with tsx


#### Task 2.4: Update package.json Scripts
**Objective**: Add convenient npm scripts for coverage

**Steps**:
1. View current scripts:
```bash
cat package.json | grep -A 20 '"scripts"'
```

2. Add these scripts to package.json (use text_editor tool):
```json
"coverage": "pnpm test -- --coverage && pnpm coverage:report",
"coverage:report": "nyc report --reporter=html --reporter=text-summary",
"coverage:merge": "tsx scripts/merge-coverage.ts",
"test:coverage": "vitest run --coverage",
"test:e2e:coverage": "COVERAGE=1 playwright test"
```

3. Verify scripts added:
```bash
pnpm run | grep coverage
```

**Acceptance Criteria**:
- [ ] All 5 coverage scripts added to package.json
- [ ] Scripts follow existing naming conventions
- [ ] No syntax errors in package.json

---

## User Story 3: Separate Unit and Integration Tests
**As a** developer  
**I want** unit tests separate from integration tests  
**So that** I can run fast unit tests during TDD without waiting for integration tests

### Context
- Current: All tests mixed in `src/**/*.test.ts`
- Problem: Slow feedback loop (integration tests run every time)
- Solution: Move integration tests to `tests/integration/` directory

### Tasks

#### Task 3.1: Identify Integration Tests
**Objective**: Find which tests are integration tests vs unit tests

**Criteria for Integration Tests**:
- Tests that require database (PostgreSQL)
- Tests that require Redis/cache
- Tests that require MCP manager/external services
- Tests with "repository" in name (usually DB tests)
- Tests that mock external dependencies extensively

**Steps**:
```bash
# Find potential integration tests
find src -name "*.test.ts" | xargs grep -l "repository\|redis\|cache\|mcp-manager\|postgres"

# List all current test files
find src -name "*.test.ts" -type f | sort
```

Create list in format:
```
INTEGRATION_TESTS=(
  src/lib/db/pg/repositories/chat-repository.pg.test.ts
  src/lib/db/pg/repositories/project-repository.pg.test.ts
  src/lib/ai/mcp/create-mcp-clients-manager.test.ts
  src/lib/ai/mcp/db-mcp-config-storage.test.ts
  src/lib/ai/mcp/fb-mcp-config-storage.test.ts
  src/lib/cache/safe-redis-cache.test.ts
  src/app/api/storage/actions.test.ts
  src/app/api/project/actions.test.ts
  # Add more as identified
)
```

**Acceptance Criteria**:
- [ ] List of 10-15 integration test files identified
- [ ] Separation criteria documented
- [ ] Unit tests (pure functions) remain in src/

#### Task 3.2: Create Integration Test Directory Structure
**Objective**: Set up tests/integration/ directory

**Steps**:
```bash
# Create directory structure
mkdir -p tests/integration/{db,mcp,api,cache}

# Create setup file for integration tests
cat > tests/integration/setup.ts << 'SETUPEOF'
/**
 * Integration Test Setup
 * Runs before integration tests to set up test environment
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  console.log('🔧 Setting up integration test environment...');
  // Add any global setup (DB connections, etc.)
});

afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  // Add cleanup logic
});
SETUPEOF

# Verify structure
tree tests/integration -L 2
```

**Acceptance Criteria**:
- [ ] tests/integration/ directory exists
- [ ] Subdirectories created (db, mcp, api, cache)
- [ ] setup.ts file created with proper structure

#### Task 3.3: Move Integration Tests
**Objective**: Relocate integration tests to new directory

**Steps**:
```bash
# Move each integration test (example for one)
# Repeat for each file in INTEGRATION_TESTS list

# Example: Move chat repository test
git mv src/lib/db/pg/repositories/chat-repository.pg.test.ts \
       tests/integration/db/chat-repository.test.ts

# Update import paths in the moved file
# Change: import { ChatRepository } from './chat-repository.pg'
# To: import { ChatRepository } from '@/lib/db/pg/repositories/chat-repository.pg'

# Repeat for all integration tests
```

Alternative approach (create script):
```bash
cat > scripts/move-integration-tests.sh << 'MOVEEOF'
#!/bin/bash
set -e

echo "Moving integration tests..."

# Define mappings
declare -A test_mappings=(
  ["src/lib/db/pg/repositories/chat-repository.pg.test.ts"]="tests/integration/db/chat-repository.test.ts"
  ["src/lib/db/pg/repositories/project-repository.pg.test.ts"]="tests/integration/db/project-repository.test.ts"
  ["src/lib/ai/mcp/create-mcp-clients-manager.test.ts"]="tests/integration/mcp/mcp-clients-manager.test.ts"
  ["src/lib/ai/mcp/db-mcp-config-storage.test.ts"]="tests/integration/mcp/db-mcp-config-storage.test.ts"
  ["src/lib/cache/safe-redis-cache.test.ts"]="tests/integration/cache/redis-cache.test.ts"
)

for src in "${!test_mappings[@]}"; do
  dest="${test_mappings[$src]}"
  if [ -f "$src" ]; then
    echo "Moving $src -> $dest"
    git mv "$src" "$dest"
  fi
done

echo "✅ Integration tests moved"
MOVEEOF

chmod +x scripts/move-integration-tests.sh
bash scripts/move-integration-tests.sh
```

**Acceptance Criteria**:
- [ ] All integration tests moved to tests/integration/
- [ ] Files organized in appropriate subdirectories
- [ ] Git history preserved with git mv


#### Task 3.4: Create Separate Vitest Config for Integration Tests
**Objective**: Configure separate test runner for integration tests

**Steps**:
1. Create `vitest.integration.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['tests/integration/setup.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000, // Longer timeout for integration tests
  },
});
```

2. Update existing `vitest.config.ts` to only run unit tests:
```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'unit',
    include: ['src/**/*.test.ts'],
    exclude: ['**/tests/**', '**/node_modules/**'],
    globals: true,
    environment: 'node',
  },
});
```

3. Add test scripts to package.json:
```json
"test": "vitest run",
"test:unit": "vitest run --config vitest.config.ts",
"test:integration": "vitest run --config vitest.integration.config.ts",
"test:watch": "vitest",
"test:all": "pnpm test:unit && pnpm test:integration && pnpm test:e2e"
```

**Acceptance Criteria**:
- [ ] vitest.integration.config.ts created
- [ ] vitest.config.ts updated to exclude tests/
- [ ] New test scripts added to package.json
- [ ] Can run unit and integration tests separately

#### Task 3.5: Verify Test Separation
**Objective**: Confirm tests run correctly in isolation

**Steps**:
```bash
# Run unit tests only (should be fast: <1 minute)
pnpm test:unit
# Note the duration

# Run integration tests only
pnpm test:integration
# Note the duration

# Run all tests
pnpm test:all

# Verify counts match
echo "Unit + Integration count should equal original test count"
```

**Expected Results**:
- Unit tests: ~25-30 test files, runs in <30 seconds
- Integration tests: ~12-15 test files, runs in 1-2 minutes
- Total: 41 test files (same as before), all passing

**Acceptance Criteria**:
- [ ] pnpm test:unit completes successfully in <30s
- [ ] pnpm test:integration completes successfully
- [ ] All 481 tests still passing
- [ ] No tests lost in migration

---

## User Story 4: Establish Coverage Baseline
**As a** developer  
**I want** documented baseline coverage metrics  
**So that** I can track improvements over time

### Context
- After E2E instrumentation, need to capture new baseline
- Document current state before making improvements
- Set realistic targets for each layer

### Tasks

#### Task 4.1: Generate Full Coverage Report
**Objective**: Run all tests with coverage enabled

**Steps**:
```bash
# Run unit tests with coverage
pnpm test:coverage

# Move coverage to specific location
mv coverage/coverage-final.json coverage/coverage-vitest.json

# Note: E2E coverage will be added in Phase 2
# For now, document unit+integration coverage

# Generate reports
pnpm coverage:report

# View coverage summary
cat coverage/text-summary.txt
```

**Acceptance Criteria**:
- [ ] Coverage report generated successfully
- [ ] HTML report viewable at coverage/index.html
- [ ] Text summary shows breakdown by file
- [ ] Can identify lowest-covered critical files

#### Task 4.2: Create Coverage Metrics Document
**Objective**: Document baseline in structured format

**Steps**:
1. Create `docs/TESTING-METRICS.md`:
```markdown
# Testing Metrics & Coverage Baseline

**Last Updated**: 2025-11-08  
**Phase**: Phase 1 Complete

---

## Coverage Baseline (After Phase 1)

### Overall Coverage (Unit + Integration Tests)

| Metric | Percentage | Target |
|--------|------------|--------|
| Lines | X.XX% | 70% |
| Statements | X.XX% | 70% |
| Functions | XX.XX% | 75% |
| Branches | XX.XX% | 80% |

### Coverage by Layer

| Layer | Lines | Functions | Branches | Priority | Target |
|-------|-------|-----------|----------|----------|--------|
| **Core Logic** (`src/lib/`) | | | | High | 80% |
| - AI/Workflow | | | | Critical | 85% |
| - Database Repositories | | | | Critical | 80% |
| - Auth/Permissions | | | | Critical | 90% |
| - MCP Tools | | | | High | 75% |
| - Utilities | | | | Medium | 70% |
| **API Routes** (`src/app/api/`) | | | | High | 60% |
| **UI Components** (`src/components/`) | | | | Low | 40% |
| **App Pages** (`src/app/`) | | | | Low | 30% |

### Top 10 Untested Critical Paths

1. `src/app/api/chat/route.ts` - Main chat endpoint (X% coverage)
2. `src/lib/ai/workflow/executor/node-executor.ts` - Workflow engine (X% coverage)
3. [Identify from coverage report]
4. [...]

### Test Suite Statistics

| Suite | Files | Tests | Duration | Status |
|-------|-------|-------|----------|--------|
| Unit Tests | XX | XXX | <30s | ✅ |
| Integration Tests | XX | XXX | ~2m | ✅ |
| E2E Tests | 18 | 144 | ~5m | ✅ |
| **Total** | **XX** | **XXX** | **~7m** | **✅** |

---

## Historical Tracking

### Phase 1 Completion (2025-11-08)
- **Before**: 9.11% reported (Vitest only, no E2E)
- **After**: X.XX% (Unit + Integration, E2E not yet instrumented)
- **Change**: +XX.XX percentage points
- **Notes**: Separated unit/integration tests, fixed 1 failing test

### Future Milestones
- **Phase 2 Target**: 70% overall (with E2E instrumentation)
- **Phase 3 Target**: 75% overall (with critical path tests)
- **Final Target**: 80% overall with 90% on core logic

---

## Coverage Trends

[Chart placeholder - will update monthly]

---

## Known Coverage Gaps

### High Priority
1. **AI Workflows**: Limited test coverage on complex workflow execution paths
2. **MCP Tool Integration**: Some tools lack integration tests
3. **Error Handling**: Many error paths untested

### Medium Priority
1. **UI Components**: Most components lack tests (acceptable per TDD philosophy)
2. **API Routes**: Some routes have minimal coverage

### Low Priority  
1. **Type Definitions**: Type-only files don't need coverage
2. **Configuration Files**: Static configs don't need tests
```

2. Fill in actual numbers from coverage report

**Acceptance Criteria**:
- [ ] TESTING-METRICS.md created with proper structure
- [ ] All tables filled with actual data from coverage report
- [ ] Top 10 untested files identified
- [ ] Historical tracking section started

#### Task 4.3: Add Coverage Badge to README
**Objective**: Make coverage visible in project README

**Steps**:
1. Generate badge markdown:
```markdown
![Coverage](https://img.shields.io/badge/coverage-XX.X%25-brightgreen)
```

2. Add to README.md near top:
```bash
# Find the badges section
rg "!\[.*\]" README.md

# Add coverage badge near other badges
```

3. Optional: Set up automated badge updates via CI

**Acceptance Criteria**:
- [ ] Coverage badge added to README.md
- [ ] Badge shows current coverage percentage
- [ ] Badge color appropriate (red <50%, yellow 50-75%, green >75%)

#### Task 4.4: Commit Phase 1 Completion
**Objective**: Save all Phase 1 work

**Steps**:
```bash
# Stage all changes
git add .

# Commit with comprehensive message
git commit -m "feat(testing): complete Phase 1 testing improvements

Phase 1 Deliverables:
- ✅ Fixed failing test in models.test.ts
- ✅ Installed E2E coverage tooling (nyc, istanbul)
- ✅ Separated unit/integration tests (tests/integration/)
- ✅ Created coverage merge scripts
- ✅ Documented baseline metrics in TESTING-METRICS.md
- ✅ Added coverage scripts to package.json

Test Suite Changes:
- Unit tests: XX files in src/**/*.test.ts (<30s runtime)
- Integration tests: XX files in tests/integration/ (~2m runtime)
- E2E tests: 18 files (unchanged, ~5m runtime)
- All 481 tests passing

Coverage Improvements:
- Baseline documented: X.XX% overall coverage
- Can now run unit/integration/e2e tests separately
- Foundation ready for Phase 2 (E2E instrumentation)

Next Steps: Phase 2 - Strategic Coverage Improvements"

# Verify commit
git log -1 --stat
git diff HEAD~1 --stat
```

**Acceptance Criteria**:
- [ ] All Phase 1 changes committed
- [ ] Commit message comprehensive and clear
- [ ] Can review changes with git show
- [ ] Working tree clean (no uncommitted changes)

---

## Phase 1 Completion Checklist

### User Story 1: Fix Failing Test ✅
- [x] Task 1.1: Investigate test failure
- [x] Task 1.2: Fix test or implementation
- [x] Task 1.3: Commit the fix

### User Story 2: Install E2E Coverage Tooling ✅
- [x] Task 2.1: Install coverage dependencies
- [x] Task 2.2: Configure NYC coverage tool
- [x] Task 2.3: Add coverage merge script
- [x] Task 2.4: Update package.json scripts

### User Story 3: Separate Unit and Integration Tests ✅
- [x] Task 3.1: Identify integration tests
- [x] Task 3.2: Create integration test directory
- [x] Task 3.3: Move integration tests
- [x] Task 3.4: Create separate Vitest config
- [x] Task 3.5: Verify test separation

### User Story 4: Establish Coverage Baseline ✅
- [x] Task 4.1: Generate full coverage report
- [x] Task 4.2: Create coverage metrics document
- [x] Task 4.3: Add coverage badge to README
- [x] Task 4.4: Commit Phase 1 completion

---

## Success Criteria Validation

Run these commands to verify Phase 1 completion:

```bash
# 1. All tests pass
pnpm test:all
# Expected: 481 tests passing across unit + integration + e2e

# 2. Tests separated correctly
pnpm test:unit
# Expected: Completes in <30 seconds

pnpm test:integration
# Expected: Completes in ~2 minutes

# 3. Coverage report generated
pnpm coverage:report
# Expected: HTML report at coverage/index.html

# 4. Documentation exists
ls docs/TESTING-METRICS.md
cat docs/TESTING-METRICS.md | grep "Coverage Baseline"
# Expected: File exists with baseline data

# 5. Scripts available
pnpm run | grep -E "test:|coverage"
# Expected: See test:unit, test:integration, coverage scripts

# 6. All changes committed
git status
# Expected: Working tree clean
```

---

## Next Phase Preview

**Phase 2: Strategic Coverage Improvements** will focus on:
1. AI/MCP Workflow Test Suite (critical business logic)
2. API Contract Testing (prevent breaking changes)
3. Critical Path E2E Enhancement (protect revenue flows)

See `docs/TESTING-IMPROVEMENT-PLAN.md` for full roadmap.

---

**Phase 1 Status**: Ready for AI Agent Execution  
**Estimated Completion Time**: 2-3 hours (automated)  
**Manual Review Required**: Validate test fix decision (Task 1.2)
