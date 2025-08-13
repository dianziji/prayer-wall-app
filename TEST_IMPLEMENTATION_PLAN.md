# 🚀 测试实施详细计划

## 📅 Phase 1: 基础设施建设 (Week 1-2)

### Week 1: 测试环境重构

#### Day 1-2: 目录结构重组
```bash
# 创建新的测试目录结构
mkdir -p tests/{unit,integration,e2e}/{components,api,auth,database,workflows,user-flows,performance,accessibility}
mkdir -p tests/{fixtures,mocks,utils}
mkdir -p tests/mocks/{api,components,services}
```

**任务清单**:
- [ ] 迁移现有测试到新结构
- [ ] 创建测试配置文件
- [ ] 设置测试环境变量
- [ ] 建立测试数据管理

#### Day 3-4: 工具链升级
```json
// package.json 新增依赖
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0", 
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-environment-jsdom": "^29.7.0",
    "fake-indexeddb": "^5.0.0",
    "test-data-bot": "^0.8.0"
  }
}
```

**实施步骤**:
1. 安装 Playwright: `npm install @playwright/test`
2. 配置 MSW: 设置 API mock 服务
3. 更新 Jest 配置
4. 创建测试数据工厂

#### Day 5: 修复现有不稳定测试
**当前问题**:
- NextRequest 构造函数问题
- Supabase mock 链不完整
- 组件测试超时问题

**解决方案**:
- 统一 API 测试 mock 模式
- 完善 Supabase 查询链 mock
- 优化组件测试异步处理

### Week 2: 核心测试工具建设

#### Day 6-7: 测试工具函数库
```typescript
// tests/utils/setup.ts
export const setupTestEnvironment = () => {
  // 全局测试配置
}

// tests/utils/factories.ts  
export const createMockUser = () => ({
  id: 'test-user-id',
  username: 'testuser',
  avatar_url: null
})

// tests/utils/helpers.ts
export const renderWithProviders = (component) => {
  // 带 Context 的渲染函数
}
```

#### Day 8-9: MSW API Mock 设置
```typescript
// tests/mocks/api/handlers.ts
export const handlers = [
  rest.get('/api/prayers', (req, res, ctx) => {
    return res(ctx.json(mockPrayers))
  }),
  rest.post('/api/prayers', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true }))
  })
]
```

#### Day 10: Playwright E2E 环境配置
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ]
})
```

## 📅 Phase 2: 核心功能测试 (Week 3-4)

### Week 3: API 层完整测试

#### Day 11-12: API 路由测试
**目标**: API 覆盖率达到 95%+

**优先级列表**:
1. `/api/prayers` - CRUD 操作 ⭐⭐⭐
2. `/api/user/stats` - 用户统计 ⭐⭐⭐  
3. `/api/user/prayers` - 用户祈祷列表 ⭐⭐
4. `/api/likes` - 点赞功能 ⭐⭐
5. `/api/comments` - 评论功能 ⭐

**测试用例示例**:
```typescript
// tests/integration/api/prayers.test.ts
describe('/api/prayers', () => {
  describe('GET', () => {
    it('should return prayers for current week', async () => {
      // 测试获取当前周祈祷
    })
    
    it('should filter by week parameter', async () => {
      // 测试周过滤功能
    })
    
    it('should handle pagination', async () => {
      // 测试分页功能
    })
  })
  
  describe('POST', () => {
    it('should create prayer when authenticated', async () => {
      // 测试认证用户创建祈祷
    })
    
    it('should validate prayer content', async () => {
      // 测试内容验证
    })
    
    it('should reject unauthorized requests', async () => {
      // 测试权限控制
    })
  })
})
```

#### Day 13-14: 认证和权限测试
```typescript
// tests/integration/auth/authentication.test.ts
describe('Authentication Flow', () => {
  it('should handle successful login', async () => {
    // 测试登录流程
  })
  
  it('should protect authenticated routes', async () => {
    // 测试路由保护
  })
  
  it('should handle session expiry', async () => {
    // 测试会话过期
  })
})
```

### Week 4: 核心组件测试

#### Day 15-16: 表单组件测试
**重点组件**:
- `PrayerForm` - 祈祷创建/编辑
- `CommentForm` - 评论表单
- `LoginForm` - 登录表单

```typescript
// tests/unit/components/prayer-form.test.tsx
describe('PrayerForm', () => {
  it('should validate required fields', async () => {
    // 测试必填字段验证
  })
  
  it('should handle character limits', async () => {
    // 测试字符限制
  })
  
  it('should submit form data correctly', async () => {
    // 测试表单提交
  })
  
  it('should handle API errors gracefully', async () => {
    // 测试错误处理
  })
})
```

#### Day 17-18: 交互组件测试
**重点组件**:
- `PrayerCard` - 祈祷卡片
- `LikeButton` - 点赞按钮
- `CommentList` - 评论列表

#### Day 19-20: 布局和导航测试
**重点组件**:
- `Header` - 页面头部
- `WeeklyWallClient` - 主要内容区域
- `Navigation` - 导航组件

## 📅 Phase 3: 用户体验测试 (Week 5-6)

### Week 5: 关键用户流程 E2E 测试

#### Day 21-22: 核心用户流程
```typescript
// tests/e2e/user-flows/prayer-creation.spec.ts
test('complete prayer creation flow', async ({ page }) => {
  // 1. 用户登录
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=login-button]')
  
  // 2. 导航到当前周
  await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
  
  // 3. 创建祈祷
  await page.fill('[data-testid=prayer-content]', 'Test prayer content')
  await page.click('[data-testid=submit-prayer]')
  
  // 4. 验证祈祷出现在墙上
  await expect(page.locator('[data-testid=prayer-card]')).toContainText('Test prayer content')
})
```

**测试流程清单**:
- [ ] 用户注册和登录流程
- [ ] 祈祷创建和发布流程  
- [ ] 祈祷互动流程 (点赞、评论)
- [ ] 个人祈祷管理流程
- [ ] 周切换和历史查看流程

#### Day 23-24: 移动端响应式测试
```typescript
// tests/e2e/mobile/responsive.spec.ts
test.describe('Mobile Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    // 测试移动端布局和交互
  })
})
```

### Week 6: 性能和可访问性测试

#### Day 25-26: 性能基准测试
```typescript
// tests/e2e/performance/load-time.spec.ts
test('page load performance', async ({ page }) => {
  const response = await page.goto('/')
  
  // 验证页面加载时间
  expect(response.status()).toBe(200)
  
  // 检查核心 Web Vitals
  const metrics = await page.evaluate(() => ({
    FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime
  }))
  
  expect(metrics.FCP).toBeLessThan(2000) // 2s
  expect(metrics.LCP).toBeLessThan(4000) // 4s
})
```

#### Day 27-28: 可访问性测试
```typescript
// tests/e2e/accessibility/a11y.spec.ts
import { injectAxe, checkA11y } from 'axe-playwright'

test('accessibility compliance', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  })
})
```

## 📅 Phase 4: 高级测试特性 (Week 7-8)

### Week 7: 高级集成测试

#### Day 29-30: 数据库集成测试
```typescript
// tests/integration/database/prayer-operations.test.ts
describe('Prayer Database Operations', () => {
  beforeEach(async () => {
    // 设置测试数据库
    await setupTestDatabase()
  })
  
  afterEach(async () => {
    // 清理测试数据
    await cleanupTestDatabase()
  })
  
  it('should create prayer with correct metadata', async () => {
    // 测试祈祷创建的数据库操作
  })
})
```

#### Day 31-32: 复杂业务流程测试
```typescript
// tests/integration/workflows/prayer-lifecycle.test.ts
describe('Prayer Lifecycle Workflow', () => {
  it('should handle complete prayer lifecycle', async () => {
    // 1. 创建祈祷
    // 2. 其他用户点赞评论
    // 3. 作者编辑祈祷
    // 4. 生成统计数据
    // 5. 导出和分享
  })
})
```

### Week 8: 测试优化和CI集成

#### Day 33-34: 测试性能优化
- 并行测试执行
- 测试缓存策略
- 智能测试选择

#### Day 35: CI/CD 集成
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
```

## 📊 成功指标和验收标准

### 覆盖率目标
- **总体覆盖率**: 80%+
- **API 路由**: 95%+
- **核心组件**: 90%+
- **工具函数**: 95%+

### 质量指标
- **测试稳定性**: 99%+ (无间歇性失败)
- **测试执行速度**: 
  - 单元测试: <2分钟
  - 集成测试: <5分钟
  - E2E测试: <10分钟
- **Bug 检测率**: 新功能 bug 在测试阶段发现率 >90%

### 团队采用指标
- **TDD 采用率**: 新功能 80% 采用 TDD
- **测试代码审查**: 100% PR 包含测试质量检查
- **测试维护**: 破损测试修复时间 <4小时

## 🔄 持续改进计划

### 每周回顾
- 测试覆盖率趋势分析
- 失败测试根因分析
- 测试执行性能监控

### 每月优化
- 测试工具链升级评估
- 测试策略调整
- 团队测试技能培训

### 季度规划
- 测试技术栈演进规划
- 自动化测试扩展计划
- 测试质量标准提升

---

这个详细的实施计划将确保你的测试改进项目能够有序推进，并在8周内建立起完善的测试体系。每个阶段都有明确的目标、具体的任务和可衡量的成果。