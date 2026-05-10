/**
 * Integration Test Runner
 *
 * Executes the full integration test suite:
 * 1. Frontend unit tests (vitest)
 * 2. Go backend tests
 * 3. Compatibility report generation
 * 4. Summary report
 *
 * Each step runs independently — failures in one step do not abort subsequent steps.
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const projectRoot = path.resolve(frontendDir, '..')
const backendDir = path.resolve(projectRoot, 'backend')
const reportsDir = path.resolve(projectRoot, 'test-reports')

// Ensure test-reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true })
}

const results = []

function printHeader(step, total, label) {
  const line = `=== [${step}/${total}] ${label} ===`
  console.log('')
  console.log('='.repeat(line.length))
  console.log(line)
  console.log('='.repeat(line.length))
  console.log('')
}

function runStep(step, total, label, command, options = {}) {
  printHeader(step, total, label)
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || frontendDir,
      timeout: options.timeout || 120000,
      ...options,
    })
    console.log(`\n[PASS] ${label}`)
    results.push({ step, label, status: 'PASS' })
  } catch (err) {
    console.error(`\n[FAIL] ${label}`)
    console.error(`       Exit code: ${err.status}`)
    results.push({ step, label, status: 'FAIL' })
  }
}

console.log('╔════════════════════════════════════════════╗')
console.log('║     PORTFOLIO INTEGRATION TEST SUITE       ║')
console.log('╚════════════════════════════════════════════╝')

const TOTAL_STEPS = 4

// ── Step 1: Frontend Unit Tests ──────────────────────────────
runStep(1, TOTAL_STEPS, 'Running frontend unit tests', 'npm run test:unit')

// ── Step 2: Go Backend Tests ─────────────────────────────────
runStep(2, TOTAL_STEPS, 'Running Go backend tests', 'go test ./...', {
  cwd: backendDir,
  timeout: 180000,
})

// ── Step 3: Compatibility Report Generation ──────────────────
printHeader(3, TOTAL_STEPS, 'Generating compatibility report')
try {
  const compatScript = path.join(__dirname, 'generate-compat-report.js')
  execSync(`node "${compatScript}"`, {
    stdio: 'inherit',
    cwd: frontendDir,
    timeout: 60000,
  })
  console.log(`\n[PASS] Generating compatibility report`)
  results.push({ step: 3, label: 'Generating compatibility report', status: 'PASS' })
} catch (err) {
  console.error(`\n[FAIL] Generating compatibility report`)
  console.error(`       Exit code: ${err.status}`)
  results.push({ step: 3, label: 'Generating compatibility report', status: 'FAIL' })
}

// ── Step 4: Summary ──────────────────────────────────────────
printHeader(4, TOTAL_STEPS, 'Generating summary report')

const passed = results.filter((r) => r.status === 'PASS').length
const failed = results.filter((r) => r.status === 'FAIL').length

console.log('')
console.log('  Integration Test Results:')
console.log('  ─────────────────────────')
results.forEach((r) => {
  const icon = r.status === 'PASS' ? '  ✅' : '  ❌'
  console.log(`  ${icon}  [${r.status}] Step ${r.step}: ${r.label}`)
})
console.log('')
console.log(`  Passed: ${passed}/${TOTAL_STEPS}  |  Failed: ${failed}/${TOTAL_STEPS}`)
console.log('')

// Generate summary markdown report
const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
const summaryLines = []
summaryLines.push('# Integration Test Summary')
summaryLines.push('')
summaryLines.push(`**Test time:** ${timestamp}`)
summaryLines.push('')
summaryLines.push('| Step | Status | Description |')
summaryLines.push('|------|--------|-------------|')
results.forEach((r) => {
  const statusIcon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'
  summaryLines.push(`| ${r.step} | ${statusIcon} | ${r.label} |`)
})
summaryLines.push('')
summaryLines.push(`**Total:** ${passed}/${TOTAL_STEPS} passed, ${failed}/${TOTAL_STEPS} failed`)
summaryLines.push('')

const summaryPath = path.join(reportsDir, 'integration-summary.md')
fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf-8')
console.log(`  Summary report written to: ${summaryPath}`)
console.log('')

// Exit with non-zero code if any step failed
if (failed > 0) {
  console.log('  ⚠️  Some integration steps failed. Check the logs above for details.')
  process.exit(1)
} else {
  console.log('  ✅ All integration steps passed!')
  process.exit(0)
}
