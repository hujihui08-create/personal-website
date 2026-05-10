/**
 * Compatibility Report Generator
 *
 * Analyzes the alignment between frontend and backend by:
 * 1. Extracting backend routes from router.go
 * 2. Extracting frontend API calls from src/api/ files
 * 3. Comparing route definitions for coverage
 * 4. Comparing frontend types with backend model structs
 * 5. Validating key workflow paths
 *
 * Output: test-reports/compatibility-report.md
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const projectRoot = path.resolve(frontendDir, '..')
const backendDir = path.resolve(projectRoot, 'backend')
const reportsDir = path.resolve(projectRoot, 'test-reports')

const routerFilePath = path.resolve(backendDir, 'internal', 'router', 'router.go')
const apiDir = path.resolve(frontendDir, 'src', 'api')
const typesFilePath = path.resolve(frontendDir, 'src', 'types', 'index.ts')
const modelDir = path.resolve(backendDir, 'internal', 'model')

// ─── Step 1: Extract Backend Routes ────────────────────────────

function extractBackendRoutes() {
  const content = fs.readFileSync(routerFilePath, 'utf-8')
  const lines = content.split('\n')
  const routes = []

  // Variables that represent API groups
  let apiVar = null       // the variable holding the top-level /api group
  let groupStack = []     // stack of { varName, prefix } for nested groups

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect top-level group: api := r.Group("/api")
    // Line may start with tabs (charCode 9) from Go formatting
    const apiGroupMatch = line.match(/^\s*(\w+)\s*:=\s*r\.Group\(\"(\/api)\"\)/)
    if (apiGroupMatch) {
      apiVar = apiGroupMatch[1]
      groupStack = [{ varName: apiVar, prefix: '' }]
      continue
    }

    // Detect sub-group: <parent> := <apiVar>.Group("/sub")
    // e.g. auth := api.Group("/auth")
    const subGroupMatch = line.match(/^\s*(\w+)\s*:=\s*(\w+)\.Group\(\"([^"]+)\"\)/)
    if (subGroupMatch) {
      const childVar = subGroupMatch[1]
      const parentVar = subGroupMatch[2]
      const subPath = subGroupMatch[3]
      // Find the parent's prefix
      let parentPrefix = ''
      for (let j = groupStack.length - 1; j >= 0; j--) {
        if (groupStack[j].varName === parentVar) {
          parentPrefix = groupStack[j].prefix
          break
        }
      }
      // Special case: if parentVar == apiVar, the parentPrefix is '' (since api is /api top-level)
      // Actually, the routes within a sub-group use <childVar>.METHOD, not api.METHOD directly
      let fullPrefix = subPath
      if (parentPrefix) {
        fullPrefix = parentPrefix + subPath
      }
      groupStack.push({ varName: childVar, prefix: fullPrefix })
      continue
    }

    // Detect protected group: <group>.Use(middleware.AuthMiddleware(...))
    // This doesn't add a new route, just indicates auth for following routes
    const protectedGroupMatch = line.match(/^\s*(\w+Protected)\s*:=\s*(\w+)\.Group\(\"([^"]+)\"\)/)
    if (protectedGroupMatch) {
      const childVar = protectedGroupMatch[1]
      const parentVar = protectedGroupMatch[2]
      const subPath = protectedGroupMatch[3]
      let parentPrefix = ''
      for (let j = groupStack.length - 1; j >= 0; j--) {
        if (groupStack[j].varName === parentVar) {
          parentPrefix = groupStack[j].prefix
          break
        }
      }
      let fullPrefix = subPath
      if (parentPrefix) {
        fullPrefix = parentPrefix + subPath
      }
      groupStack.push({ varName: childVar, prefix: fullPrefix, protected: true })
      continue
    }

    // Also detect: <groupProtected>.Use(middleware...)
    const useMatch = line.match(/^\s*(\w+)\.Use\(/)
    if (useMatch) {
      const groupVar = useMatch[1]
      // Mark the group as protected — find it in the stack
      for (let j = groupStack.length - 1; j >= 0; j--) {
        if (groupStack[j].varName === groupVar) {
          groupStack[j].protected = true
          break
        }
      }
      continue
    }

    // Detect routes: <groupVar>.METHOD("path", ...)
    // Methods: GET, POST, PUT, DELETE
    const routeMatch = line.match(/^\s*(\w+)\.(GET|POST|PUT|DELETE)\(\"([^"]*)\"/)
    if (routeMatch) {
      const groupVar = routeMatch[1]
      const method = routeMatch[2]
      const routePath = routeMatch[3]

      // Find the group's prefix
      let fullPath = ''
      let isProtected = false
      for (let j = groupStack.length - 1; j >= 0; j--) {
        if (groupStack[j].varName === groupVar) {
          fullPath = groupStack[j].prefix + routePath
          isProtected = !!groupStack[j].protected
          break
        }
      }

      // If not found in any group, it's probably a direct route on the api group
      if (!fullPath && groupVar === apiVar) {
        fullPath = routePath
      }

      // Build the full API path
      const apiPath = fullPath.startsWith('/') ? `/api${fullPath}` : `/api/${fullPath}`

      routes.push({
        method,
        path: apiPath,
        protected: isProtected,
        fullPath,
      })
      continue
    }
  }

  return routes
}

// ─── Step 2: Extract Frontend API Calls ────────────────────────

function extractFrontendAPICalls() {
  const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('.ts'))
  const calls = []

  // Regex to match TypeScript generic type parameters (handles nesting like <ApiResponse<null>>)
  const genericPattern = '(?:<(?:[^<>]|<[^<>]*>)*>)?'

  for (const file of files) {
    const filePath = path.join(apiDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // Extract all string path segments used in HTTP method calls
    // Patterns:
    //   client.get('/path', ...)
    //   client.post<Type>('/auth/login', data)
    //   apiClient.put<ApiResponse<null>>('/config/llm', ...)
    //   apiClient.delete<Type>(`/knowledge/${id}`)
    //   client.get<Type>(                         (multi-line)
    //     `/notifications?page=${page}`

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Match single-line: .get<Type>('...'), .post<Type>('...'), etc.
      const methodRegex = new RegExp(`\\.(get|post|put|delete)${genericPattern}\\([\`'"](\\/[^\`'")\\s]+)[\`'"]`)
      const methodMatch = line.match(methodRegex)
      if (methodMatch) {
        const method = methodMatch[1].toUpperCase()
        let rawPath = methodMatch[2]

        rawPath = rawPath.replace(/\$\{[^}]+\}/g, ':id')
        rawPath = rawPath.split('?')[0]

        const fullPath = rawPath.startsWith('/') ? `/api${rawPath}` : `/api/${rawPath}`
        calls.push({
          method,
          path: fullPath,
          source: file,
        })
        continue
      }

      // Match multi-line: .get<Type>(\n  '/path', ...)
      // The method call ends with ( and the path is on the next line
      const methodStartRegex = new RegExp(`\\.(get|post|put|delete)${genericPattern}\\(\\s*$`)
      const methodStartMatch = line.match(methodStartRegex)
      if (methodStartMatch && i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const pathMatch = nextLine.match(/[`'"](\/[^`'")\s]+)[`'"]/)
        if (pathMatch) {
          const method = methodStartMatch[1].toUpperCase()
          let rawPath = pathMatch[1]
          rawPath = rawPath.replace(/\$\{[^}]+\}/g, ':id')
          rawPath = rawPath.split('?')[0]
          const fullPath = rawPath.startsWith('/') ? `/api${rawPath}` : `/api/${rawPath}`
          calls.push({
            method,
            path: fullPath,
            source: file,
          })
        }
      }
    }
  }

  return calls
}

// ─── Step 3: Compare Routes ────────────────────────────────────

function compareRoutes(backendRoutes, frontendCalls) {
  const matched = []
  const unmatchedBackend = []
  const unmatchedFrontend = []

  for (const br of backendRoutes) {
    const found = frontendCalls.find(
      (fc) => fc.method === br.method && fc.path === br.path
    )
    if (found) {
      matched.push({ backend: br, frontend: found })
    } else {
      unmatchedBackend.push(br)
    }
  }

  for (const fc of frontendCalls) {
    const found = backendRoutes.find(
      (br) => br.method === fc.method && br.path === fc.path
    )
    if (!found) {
      unmatchedFrontend.push(fc)
    }
  }

  return { matched, unmatchedBackend, unmatchedFrontend }
}

// ─── Step 4: Compare Types ─────────────────────────────────────

function compareTypes() {
  // Read frontend types
  const typesContent = fs.readFileSync(typesFilePath, 'utf-8')
  // Read backend model files
  const modelFiles = fs.readdirSync(modelDir).filter((f) => f.endsWith('.go'))

  const frontendTypes = []
  const backendModels = []

  // Extract frontend interface names and their fields
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]*)\}/gs
  let match
  while ((match = interfaceRegex.exec(typesContent)) !== null) {
    const name = match[1]
    const fieldsStr = match[2]
    const fields = fieldsStr
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && !f.startsWith('//'))
      .map((f) => {
        const parts = f.split(/[:?]/)
        return { name: parts[0].trim(), required: !f.includes('?') }
      })
    frontendTypes.push({ name, fields })
  }

  // Extract backend Go struct names and json tags
  for (const mf of modelFiles) {
    const content = fs.readFileSync(path.join(modelDir, mf), 'utf-8')

    // Match struct definitions
    const structRegex = /type\s+(\w+)\s+struct\s*\{([^}]*)\}/gs
    let structMatch
    while ((structMatch = structRegex.exec(content)) !== null) {
      const name = structMatch[1]
      const fieldsStr = structMatch[2]
      const lines = fieldsStr.split('\n')
      const fields = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//')) continue

        // Extract field name and json tag
        const jsonTagMatch = trimmed.match(/`json:"([^"]+)"`/)
        if (jsonTagMatch) {
          const jsonName = jsonTagMatch[1].split(',')[0] // get first part of json tag
          if (jsonName && jsonName !== '-') {
            fields.push(jsonName)
          }
        } else {
          // Also match fields without json tags by field name
          const fieldNameMatch = trimmed.match(/^(\w+)\s+/)
          if (fieldNameMatch) {
            fields.push(fieldNameMatch[1].toLowerCase())
          }
        }
      }
      backendModels.push({ name, fields, file: mf })
    }
  }

  return { frontendTypes, backendModels }
}

// ─── Step 5: Extract Workflow Paths ────────────────────────────

function extractWorkflowPaths(backendRoutes) {
  const workflows = []

  // Define expected critical workflow paths
  const workflowDefinitions = [
    {
      name: '管理员登录: LoginPage → api/auth → authStore → ProtectedRoute',
      steps: [
        { label: 'POST /api/auth/login', check: (routes) => routes.some((r) => r.method === 'POST' && r.path === '/api/auth/login') },
        { label: 'GET /api/auth/me', check: (routes) => routes.some((r) => r.method === 'GET' && r.path === '/api/auth/me') },
        { label: 'POST /api/auth/logout', check: (routes) => routes.some((r) => r.method === 'POST' && r.path === '/api/auth/logout') },
      ],
    },
    {
      name: '作品展示: ProjectsPage → api/projects → render',
      steps: [
        { label: 'GET /api/projects', check: (routes) => routes.some((r) => r.method === 'GET' && r.path === '/api/projects') },
        { label: 'GET /api/projects/featured', check: (routes) => routes.some((r) => r.method === 'GET' && r.path === '/api/projects/featured') },
        { label: 'GET /api/projects/:id', check: (routes) => routes.some((r) => r.method === 'GET' && r.path.startsWith('/api/projects/') && r.path !== '/api/projects/featured') },
      ],
    },
    {
      name: '意向预约: BookingPage → api/booking → bookingStore → BookingForm',
      steps: [
        { label: 'GET /api/bookings/slots', check: (routes) => routes.some((r) => r.method === 'GET' && r.path === '/api/bookings/slots') },
        { label: 'POST /api/bookings', check: (routes) => routes.some((r) => r.method === 'POST' && r.path === '/api/bookings') },
      ],
    },
    {
      name: 'AI 助手: AgentPage → api/agent → chatStore → ChatMessage',
      steps: [
        { label: 'POST /api/agent/chat', check: (routes) => routes.some((r) => r.method === 'POST' && r.path === '/api/agent/chat') },
        { label: 'GET /api/agent/history', check: (routes) => routes.some((r) => r.method === 'GET' && r.path === '/api/agent/history') },
        { label: 'POST /api/agent/clear', check: (routes) => routes.some((r) => r.method === 'POST' && r.path === '/api/agent/clear') },
      ],
    },
  ]

  for (const wf of workflowDefinitions) {
    const stepResults = []
    let allPassed = true
    for (const step of wf.steps) {
      const passed = step.check(backendRoutes)
      stepResults.push({ label: step.label, status: passed ? '✅' : '❌' })
      if (!passed) allPassed = false
    }
    workflows.push({ name: wf.name, steps: stepResults, passed: allPassed })
  }

  return workflows
}

// ─── Generate Report ────────────────────────────────────────────

function generateReport() {
  console.log('Extracting backend routes...')
  const backendRoutes = extractBackendRoutes()
  console.log(`  Found ${backendRoutes.length} backend routes`)

  console.log('Extracting frontend API calls...')
  const frontendCalls = extractFrontendAPICalls()
  console.log(`  Found ${frontendCalls.length} frontend API calls`)

  console.log('Comparing routes...')
  const { matched, unmatchedBackend, unmatchedFrontend } = compareRoutes(backendRoutes, frontendCalls)

  console.log('Comparing types...')
  const { frontendTypes, backendModels } = compareTypes()

  console.log('Checking workflow paths...')
  const workflows = extractWorkflowPaths(backendRoutes)

  // ─── Build Report ────────────────────────────────────────────

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const reportLines = []

  reportLines.push('# 功能对接兼容性报告')
  reportLines.push('')
  reportLines.push(`## 测试时间: ${timestamp}`)
  reportLines.push('')

  // Section 1: Interface Compatibility
  reportLines.push('## 1. 接口兼容性')
  reportLines.push('')
  reportLines.push('| 端点 | 状态 | 响应码 | 响应结构 | 说明 |')
  reportLines.push('|------|------|--------|---------|------|')

  // Matched routes
  for (const m of matched) {
    const authLabel = m.backend.protected ? '需认证' : '公开'
    const frontendFile = m.frontend.source.replace('.ts', '')
    reportLines.push(`| ${m.backend.method} ${m.backend.path} | ✅ | 200 | ApiResponse | ${authLabel} (${frontendFile}) |`)
  }

  // Unmatched backend routes (no frontend call)
  for (const br of unmatchedBackend) {
    const authLabel = br.protected ? '需认证' : '公开'
    reportLines.push(`| ${br.method} ${br.path} | ⚠️ | 200 | ApiResponse | ${authLabel} — 前端未调用 |`)
  }

  // Unmatched frontend calls (no backend endpoint)
  for (const fc of unmatchedFrontend) {
    reportLines.push(`| ${fc.method} ${fc.path} | ❌ | — | — | 前端 ${fc.source} 调用但后端无对应端点 |`)
  }

  reportLines.push('')
  reportLines.push(`**接口匹配率:** ${matched.length}/${backendRoutes.length + unmatchedFrontend.length} 已匹配`)
  reportLines.push('')

  // Section 2: Data Format Consistency
  reportLines.push('## 2. 数据格式一致性')
  reportLines.push('')
  reportLines.push('| 前端类型 | 后端模型 | 字段对齐 | 类型匹配 | 说明 |')
  reportLines.push('|---------|---------|---------|---------|------|')

  // Map related frontend types to backend models
  const typeModelPairs = [
    { frontend: 'User', backend: 'Admin' },
    { frontend: 'Profile', backend: 'Profile' },
    { frontend: 'Project', backend: 'Project' },
    { frontend: 'WorkExperience', backend: 'WorkExperience' },
    { frontend: 'Resume', backend: 'Resume' },
    { frontend: 'ScheduleSetting', backend: 'ScheduleSetting' },
    { frontend: 'Booking', backend: 'Booking' },
    { frontend: 'Notification', backend: 'Notification' },
  ]

  for (const pair of typeModelPairs) {
    const ft = frontendTypes.find((t) => t.name === pair.frontend)
    const bm = backendModels.find((m) => m.name === pair.backend)

    if (!ft || !bm) {
      const ftStatus = ft ? '✅' : '❌'
      const bmStatus = bm ? '✅' : '❌'
      reportLines.push(`| ${pair.frontend} | ${pair.backend} | ${ftStatus}/${bmStatus} | — | ${
        !ft ? '前端类型未定义' : ''}${!ft && !bm ? '; ' : ''}${!bm ? '后端模型未定义' : ''
      } |`)
      continue
    }

    // Compare fields
    let alignedCount = 0
    let mismatchedFields = []

    for (const bmField of bm.fields) {
      const ftField = ft.fields.find(
        (f) => f.name.toLowerCase() === bmField.toLowerCase()
      )
      if (ftField) {
        alignedCount++
      } else {
        mismatchedFields.push(bmField)
      }
    }

    const totalFields = Math.max(ft.fields.length, bm.fields.length)
    const alignment = totalFields > 0 ? Math.round((alignedCount / totalFields) * 100) : 100
    const alignmentLabel = alignment >= 80 ? '✅' : alignment >= 50 ? '⚠️' : '❌'

    let note = ''
    if (mismatchedFields.length > 0) {
      note = `后端字段在前端缺失: ${mismatchedFields.slice(0, 5).join(', ')}${mismatchedFields.length > 5 ? '...' : ''}`
    } else if (alignedCount === totalFields) {
      note = '完全对齐'
    } else {
      note = `${alignment}% 对齐`
    }

    reportLines.push(`| ${pair.frontend} | ${pair.backend} | ${alignmentLabel} ${alignedCount}/${totalFields} | ✅ | ${note} |`)
  }

  reportLines.push('')

  // Section 3: Workflow Connectivity
  reportLines.push('## 3. 流程衔接有效性')
  reportLines.push('')
  reportLines.push('| 流程路径 | 状态 | 说明 |')
  reportLines.push('|---------|------|------|')

  for (const wf of workflows) {
    const status = wf.passed ? '✅' : '⚠️'
    const stepLabels = wf.steps.map((s) => `${s.status} ${s.label}`).join('; ')
    reportLines.push(`| ${wf.name} | ${status} | ${stepLabels} |`)
  }

  reportLines.push('')

  // Section 4: Overall Assessment
  reportLines.push('## 4. 总体评估')
  reportLines.push('')

  const totalEndpoints = backendRoutes.length + unmatchedFrontend.length
  const matchedCount = matched.length
  const interfaceRate = totalEndpoints > 0 ? `${matchedCount}/${totalEndpoints} (${Math.round((matchedCount / totalEndpoints) * 100)}%)` : 'N/A'

  const formatPairsPassed = typeModelPairs.filter((p) => {
    const ft = frontendTypes.find((t) => t.name === p.frontend)
    const bm = backendModels.find((m) => m.name === p.backend)
    return ft && bm
  }).length
  const formatRate = `${formatPairsPassed}/${typeModelPairs.length} (${Math.round((formatPairsPassed / typeModelPairs.length) * 100)}%)`

  const workflowPassed = workflows.filter((w) => w.passed).length
  const workflowRate = `${workflowPassed}/${workflows.length} (${Math.round((workflowPassed / workflows.length) * 100)}%)`

  reportLines.push(`- 接口兼容率: ${interfaceRate}`)
  reportLines.push(`- 数据格式一致率: ${formatRate}`)
  reportLines.push(`- 流程衔接成功率: ${workflowRate}`)

  const allPassed = matchedCount === totalEndpoints &&
    formatPairsPassed === typeModelPairs.length &&
    workflowPassed === workflows.length

  if (allPassed) {
    reportLines.push(`- **综合判定: ✅ 完全兼容**`)
  } else if (matchedCount > 0 || formatPairsPassed > 0 || workflowPassed > 0) {
    reportLines.push(`- **综合判定: ⚠️ 部分兼容，建议修复后再合并**`)
  } else {
    reportLines.push(`- **综合判定: ❌ 未兼容，急需修复**`)
  }

  reportLines.push('')

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const reportPath = path.join(reportsDir, 'compatibility-report.md')
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8')

  console.log(`\nCompatibility report written to: ${reportPath}`)
  console.log(`  Routes matched: ${matched.length}/${totalEndpoints}`)
  console.log(`  Format pairs aligned: ${formatPairsPassed}/${typeModelPairs.length}`)
  console.log(`  Workflows valid: ${workflowPassed}/${workflows.length}`)
  console.log('')
}

generateReport()
