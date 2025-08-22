/**
 * 100用户并发登录+头像异步处理压力测试
 * 
 * 测试场景:
 * - 100个用户同时登录
 * - 每个用户都有头像需要处理
 * - 使用异步模式 (登录立即完成，头像后台处理)
 * - 验证登录速度和头像处理队列性能
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// 自定义指标
export let loginErrors = new Rate('login_errors')
export let avatarQueueErrors = new Rate('avatar_queue_errors')
export let loginDuration = new Trend('login_duration')
export let avatarQueueDuration = new Trend('avatar_queue_duration')
export let totalUsers = new Counter('total_users')

// 测试配置
export let options = {
  scenarios: {
    // 100用户同时登录场景
    concurrent_login: {
      executor: 'per-vu-iterations',
      vus: 100, // 100个虚拟用户
      iterations: 1, // 每个用户执行1次
      maxDuration: '2m', // 最大持续时间2分钟
    },
    // 头像处理状态监控场景
    avatar_monitoring: {
      executor: 'constant-vus',
      vus: 5, // 5个监控用户
      duration: '5m', // 持续5分钟监控
      startTime: '10s', // 登录开始10秒后开始监控
    }
  },
  thresholds: {
    // 登录性能要求
    'login_duration': ['p(95)<3000'], // 95%的登录请求在3秒内完成
    'login_errors': ['rate<0.05'], // 登录错误率小于5%
    
    // 头像队列性能要求
    'avatar_queue_duration': ['p(95)<1000'], // 95%的队列请求在1秒内完成
    'avatar_queue_errors': ['rate<0.10'], // 队列错误率小于10%
    
    // HTTP性能要求
    'http_req_duration': ['p(95)<5000'], // 95%的HTTP请求在5秒内完成
    'http_req_failed': ['rate<0.15'], // HTTP错误率小于15%
  }
}

// 测试用户头像URL列表 (模拟Google头像)
const AVATAR_URLS = [
  'https://lh3.googleusercontent.com/a-/AOh14GhRk8-sample1',
  'https://lh3.googleusercontent.com/a-/AOh14GhRk8-sample2', 
  'https://lh3.googleusercontent.com/a-/AOh14GhRk8-sample3',
  'https://lh4.googleusercontent.com/a-/AOh14GhRk8-sample4',
  'https://lh4.googleusercontent.com/a-/AOh14GhRk8-sample5',
  'https://lh5.googleusercontent.com/a-/AOh14GhRk8-sample6',
  'https://lh5.googleusercontent.com/a-/AOh14GhRk8-sample7',
  'https://lh6.googleusercontent.com/a-/AOh14GhRk8-sample8'
]

// 基础URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export function setup() {
  console.log('🚀 开始100用户登录+头像异步处理压力测试')
  console.log(`📍 目标URL: ${BASE_URL}`)
  console.log(`👥 并发用户数: 100`)
  console.log(`🎯 测试模式: 异步头像处理`)
  
  // 验证服务器可用性
  const healthCheck = http.get(`${BASE_URL}/api/health`)
  if (healthCheck.status !== 200) {
    console.error('❌ 服务器健康检查失败')
    throw new Error('Server health check failed')
  }
  
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL
  }
}

export default function(data) {
  // 根据场景执行不同逻辑
  if (__ENV.K6_SCENARIO === 'concurrent_login') {
    performLoginWithAvatar(data)
  } else if (__ENV.K6_SCENARIO === 'avatar_monitoring') {
    monitorAvatarProcessing(data)
  } else {
    // 默认执行登录测试
    performLoginWithAvatar(data)
  }
}

/**
 * 执行登录+头像处理测试
 */
function performLoginWithAvatar(data) {
  const userId = `test_user_${__VU}_${Date.now()}`
  const userEmail = `${userId}@test.com`
  const avatarUrl = AVATAR_URLS[(__VU - 1) % AVATAR_URLS.length]
  
  totalUsers.add(1)
  
  console.log(`🔑 用户 ${userId} 开始登录流程...`)
  
  // 1. 模拟用户登录 (不包含头像处理)
  const loginStart = Date.now()
  const loginPayload = {
    email: userEmail,
    provider: 'google',
    user_metadata: {
      name: `Test User ${__VU}`,
      email: userEmail,
      picture: avatarUrl
    }
  }
  
  const loginResponse = http.post(`${data.baseUrl}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s'
  })
  
  const loginTime = Date.now() - loginStart
  loginDuration.add(loginTime)
  
  const loginSuccess = check(loginResponse, {
    '登录状态码为200': (r) => r.status === 200,
    '登录响应时间<5秒': () => loginTime < 5000,
  })
  
  if (!loginSuccess) {
    loginErrors.add(1)
    console.error(`❌ 用户 ${userId} 登录失败: ${loginResponse.status}`)
    return
  }
  
  console.log(`✅ 用户 ${userId} 登录成功 (${loginTime}ms)`)
  
  // 2. 模拟异步头像处理请求
  if (loginResponse.body) {
    try {
      const loginData = JSON.parse(loginResponse.body)
      const authToken = loginData.access_token || 'mock_token'
      
      // 异步提交头像处理任务
      const avatarStart = Date.now()
      const avatarPayload = {
        sourceUrl: avatarUrl,
        mode: 'async' // 使用异步模式
      }
      
      const avatarResponse = http.post(`${data.baseUrl}/api/avatar/ingest`, JSON.stringify(avatarPayload), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: '5s'
      })
      
      const avatarTime = Date.now() - avatarStart
      avatarQueueDuration.add(avatarTime)
      
      const avatarSuccess = check(avatarResponse, {
        '头像队列状态码为200': (r) => r.status === 200,
        '头像队列响应时间<2秒': () => avatarTime < 2000,
      })
      
      if (avatarSuccess) {
        const avatarData = JSON.parse(avatarResponse.body)
        console.log(`🎨 用户 ${userId} 头像任务已排队: ${avatarData.taskId} (${avatarTime}ms)`)
        
        // 记录任务ID供监控使用
        if (avatarData.taskId) {
          // 可以在这里存储taskId用于后续状态查询
        }
      } else {
        avatarQueueErrors.add(1)
        console.error(`❌ 用户 ${userId} 头像排队失败: ${avatarResponse.status}`)
      }
      
    } catch (e) {
      console.error(`❌ 用户 ${userId} 头像处理异常: ${e.message}`)
      avatarQueueErrors.add(1)
    }
  }
  
  // 短暂休息
  sleep(0.1)
}

/**
 * 监控头像处理进度
 */
function monitorAvatarProcessing(data) {
  // 监控队列统计信息
  const queueStatsResponse = http.get(`${data.baseUrl}/api/avatar/queue-stats`, {
    timeout: '5s'
  })
  
  if (queueStatsResponse.status === 200) {
    try {
      const stats = JSON.parse(queueStatsResponse.body)
      console.log(`📊 队列状态: 总计${stats.queue.total}, 待处理${stats.queue.pending}, 处理中${stats.queue.processing}, 已完成${stats.queue.completed}, 失败${stats.queue.failed}`)
    } catch (e) {
      console.error('❌ 解析队列统计失败:', e.message)
    }
  }
  
  sleep(10) // 每10秒检查一次
}

export function teardown(data) {
  console.log('🏁 测试完成，生成报告...')
  
  // 最终队列状态检查
  const finalStats = http.get(`${data.baseUrl}/api/avatar/queue-stats`)
  if (finalStats.status === 200) {
    try {
      const stats = JSON.parse(finalStats.body)
      console.log('📈 最终队列统计:')
      console.log(`   总任务数: ${stats.queue.total}`)
      console.log(`   已完成: ${stats.queue.completed} (${stats.performance.processingRate})`)
      console.log(`   失败: ${stats.queue.failed} (${stats.performance.failureRate})`)
      console.log(`   待处理: ${stats.queue.pending}`)
      console.log(`   处理中: ${stats.queue.processing}`)
    } catch (e) {
      console.error('❌ 解析最终统计失败:', e.message)
    }
  }
  
  console.log('✨ 100用户登录+头像异步处理测试结束')
}

/**
 * 生成测试总结
 */
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  return {
    'stdout': generateTextSummary(data),
    [`100-user-login-avatar-async-results-${timestamp}.json`]: JSON.stringify(data, null, 2),
  }
}

/**
 * 生成文本测试总结
 */
function generateTextSummary(data) {
  const safeFormat = (value, digits = 2) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A'
    return Number(value).toFixed(digits)
  }
  
  const metrics = data.metrics
  
  return `
🔍 100用户登录+头像异步处理测试报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 总体统计
   • 总用户数: ${safeFormat(metrics.total_users?.values?.count || 0, 0)}
   • 总HTTP请求: ${safeFormat(metrics.http_reqs?.values?.count || 0, 0)}
   • 测试持续时间: ${safeFormat((data.state?.testRunDurationMs || 0) / 1000, 1)}秒

🔐 登录性能
   • 登录成功率: ${safeFormat((1 - (metrics.login_errors?.values?.rate || 0)) * 100, 1)}%
   • 平均登录时间: ${safeFormat(metrics.login_duration?.values?.avg || 0, 0)}ms
   • 95%登录时间: ${safeFormat(metrics.login_duration?.values?.['p(95)'] || 0, 0)}ms
   • 最大登录时间: ${safeFormat(metrics.login_duration?.values?.max || 0, 0)}ms

🎨 头像队列性能
   • 队列成功率: ${safeFormat((1 - (metrics.avatar_queue_errors?.values?.rate || 0)) * 100, 1)}%
   • 平均队列时间: ${safeFormat(metrics.avatar_queue_duration?.values?.avg || 0, 0)}ms
   • 95%队列时间: ${safeFormat(metrics.avatar_queue_duration?.values?.['p(95)'] || 0, 0)}ms
   • 最大队列时间: ${safeFormat(metrics.avatar_queue_duration?.values?.max || 0, 0)}ms

🌐 HTTP性能
   • 平均响应时间: ${safeFormat(metrics.http_req_duration?.values?.avg || 0, 0)}ms
   • 95%响应时间: ${safeFormat(metrics.http_req_duration?.values?.['p(95)'] || 0, 0)}ms
   • HTTP成功率: ${safeFormat((1 - (metrics.http_req_failed?.values?.rate || 0)) * 100, 1)}%
   • 请求速率: ${safeFormat(metrics.http_reqs?.values?.rate || 0, 1)} req/s

✅ 性能目标达成情况
   • 登录95%<3秒: ${(metrics.login_duration?.values?.['p(95)'] || Infinity) < 3000 ? '✅ 通过' : '❌ 未通过'}
   • 队列95%<1秒: ${(metrics.avatar_queue_duration?.values?.['p(95)'] || Infinity) < 1000 ? '✅ 通过' : '❌ 未通过'}
   • 登录错误率<5%: ${(metrics.login_errors?.values?.rate || 1) < 0.05 ? '✅ 通过' : '❌ 未通过'}
   • 队列错误率<10%: ${(metrics.avatar_queue_errors?.values?.rate || 1) < 0.10 ? '✅ 通过' : '❌ 未通过'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 建议: ${generateRecommendations(metrics)}
`
}

/**
 * 生成性能建议
 */
function generateRecommendations(metrics) {
  const recommendations = []
  
  // 登录性能建议
  const loginP95 = metrics.login_duration?.values?.['p(95)'] || 0
  if (loginP95 > 3000) {
    recommendations.push('登录时间过长，建议优化登录流程')
  }
  
  // 队列性能建议
  const queueP95 = metrics.avatar_queue_duration?.values?.['p(95)'] || 0
  if (queueP95 > 1000) {
    recommendations.push('头像队列响应过慢，建议增加队列处理能力')
  }
  
  // 错误率建议
  const loginErrors = metrics.login_errors?.values?.rate || 0
  if (loginErrors > 0.05) {
    recommendations.push('登录错误率偏高，需要检查认证系统')
  }
  
  const queueErrors = metrics.avatar_queue_errors?.values?.rate || 0
  if (queueErrors > 0.10) {
    recommendations.push('头像队列错误率偏高，需要检查队列系统稳定性')
  }
  
  if (recommendations.length === 0) {
    return '系统性能表现良好，可以承受100用户并发登录'
  }
  
  return recommendations.join('; ')
}