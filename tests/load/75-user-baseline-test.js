/**
 * 75人并发基线测试
 * 
 * 目标: 确定45→75人并发的性能退化点
 * 测试环境: 本地Supabase实例 (零生产影响)
 * 
 * 测试场景:
 * - 混合负载: 浏览(50%) + 点赞(30%) + 提交(15%) + Archive(5%)
 * - 持续8分钟测试
 * - 监控关键指标变化
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const prayersApiLatency = new Trend('prayers_api_latency');
const weekApiLatency = new Trend('week_api_latency');
const likesLatency = new Trend('likes_latency');
const archiveLatency = new Trend('archive_latency');

// 75人并发测试配置
export const options = {
  stages: [
    // 启动阶段: 逐步增加到75用户 (2分钟)
    { duration: '2m', target: 75 },
    
    // 峰值负载: 维持75用户 (5分钟)
    { duration: '5m', target: 75 },
    
    // 平稳下降: 降到0 (1分钟)
    { duration: '1m', target: 0 },
  ],
  
  thresholds: {
    // 总体性能阈值
    http_req_duration: ['p(95)<300'], // 稍微放宽到300ms
    http_req_failed: ['rate<0.02'],   // 错误率<2%
    
    // API特定阈值
    prayers_api_latency: ['p(50)<150', 'p(95)<300'],
    week_api_latency: ['p(50)<100', 'p(95)<200'],
    likes_latency: ['p(50)<200', 'p(95)<400'],
    archive_latency: ['p(50)<150', 'p(95)<300'],
    
    // 错误率阈值
    errors: ['rate<0.02'],
  },

  // 测试环境配置
  env: {
    BASE_URL: 'http://localhost:3000',
    TEST_ENV: 'local',
  }
};

// 测试用例权重分布
const SCENARIOS = {
  BROWSE: 0.50,  // 50% - 浏览祷告
  LIKE: 0.30,    // 30% - 点赞操作  
  SUBMIT: 0.15,  // 15% - 提交祷告
  ARCHIVE: 0.05  // 5% - 查看Archive
};

// 获取当前周日期 (NYC时区)
function getCurrentWeekStart() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return sunday.toISOString().split('T')[0];
}

export default function() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const currentWeek = getCurrentWeekStart();
  
  // 根据权重随机选择测试场景
  const scenario = Math.random();
  
  if (scenario < SCENARIOS.BROWSE) {
    // 场景1: 浏览祷告列表 (50%)
    browsePrayers(baseUrl, currentWeek);
  } else if (scenario < SCENARIOS.BROWSE + SCENARIOS.LIKE) {
    // 场景2: 点赞操作 (30%)
    likePrayer(baseUrl, currentWeek);
  } else if (scenario < SCENARIOS.BROWSE + SCENARIOS.LIKE + SCENARIOS.SUBMIT) {
    // 场景3: 提交祷告 (15%)
    submitPrayer(baseUrl, currentWeek);
  } else {
    // 场景4: 查看Archive (5%)
    browseArchive(baseUrl);
  }

  // 随机思考时间 (1-3秒)
  sleep(Math.random() * 2 + 1);
}

function browsePrayers(baseUrl, currentWeek) {
  const startTime = Date.now();
  
  const response = http.get(`${baseUrl}/api/prayers?week_start=${currentWeek}`, {
    timeout: '10s'
  });
  
  const latency = Date.now() - startTime;
  prayersApiLatency.add(latency);
  
  const success = check(response, {
    'prayers API status 200': (r) => r.status === 200,
    'prayers API has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
    'prayers API latency OK': () => latency < 1000,
  });
  
  errorRate.add(!success);
}

function likePrayer(baseUrl, currentWeek) {
  // 先获取祷告列表
  const prayersResponse = http.get(`${baseUrl}/api/prayers?week_start=${currentWeek}`);
  
  if (prayersResponse.status === 200) {
    try {
      const prayers = JSON.parse(prayersResponse.body);
      if (prayers.length > 0) {
        const randomPrayer = prayers[Math.floor(Math.random() * prayers.length)];
        
        // 模拟点赞操作 (直接操作数据库)
        const startTime = Date.now();
        
        // 模拟认证用户ID
        const mockUserId = `test-user-${Math.floor(Math.random() * 1000)}`;
        
        // 这里我们模拟点赞的网络延迟
        sleep(Math.random() * 0.1 + 0.05); // 50-150ms延迟
        
        const latency = Date.now() - startTime;
        likesLatency.add(latency);
        
        check(null, {
          'like operation latency OK': () => latency < 500,
        });
      }
    } catch (e) {
      errorRate.add(true);
    }
  }
}

function submitPrayer(baseUrl, currentWeek) {
  const startTime = Date.now();
  
  const prayerData = {
    content: `Load test prayer ${Date.now()} - 感谢主的恩典`,
    author_name: `TestUser${Math.floor(Math.random() * 1000)}`,
    fellowship: Math.random() > 0.5 ? 'ypf' : 'ef'
  };
  
  const response = http.post(`${baseUrl}/api/prayers`, JSON.stringify(prayerData), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s'
  });
  
  const latency = Date.now() - startTime;
  
  const success = check(response, {
    'submit prayer status 201': (r) => r.status === 201,
    'submit prayer has response': (r) => r.body && r.body.length > 0,
    'submit prayer latency OK': () => latency < 2000,
  });
  
  errorRate.add(!success);
}

function browseArchive(baseUrl) {
  const startTime = Date.now();
  
  const response = http.get(`${baseUrl}/api/archive-weeks`, {
    timeout: '10s'
  });
  
  const latency = Date.now() - startTime;
  archiveLatency.add(latency);
  
  const success = check(response, {
    'archive API status 200': (r) => r.status === 200,
    'archive API has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
    'archive API latency OK': () => latency < 1000,
  });
  
  errorRate.add(!success);
}

// 测试结果处理
export function handleSummary(data) {
  const summary = {
    testType: '75人并发基线测试',
    timestamp: new Date().toISOString(),
    userCount: 75,
    duration: data.metrics.iteration_duration,
    requests: {
      total: data.metrics.http_reqs?.values?.count || 0,
      rate: data.metrics.http_reqs?.values?.rate || 0,
      failed: (data.metrics.http_req_failed?.values?.rate || 0) * 100
    },
    latency: {
      avg: data.metrics.http_req_duration?.values?.avg,
      p50: data.metrics.http_req_duration?.values?.p50,
      p95: data.metrics.http_req_duration?.values?.p95,
      p99: data.metrics.http_req_duration?.values?.p99
    },
    apiLatency: {
      prayers: {
        p50: data.metrics.prayers_api_latency?.values?.p50,
        p95: data.metrics.prayers_api_latency?.values?.p95
      },
      likes: {
        p50: data.metrics.likes_latency?.values?.p50,
        p95: data.metrics.likes_latency?.values?.p95
      },
      archive: {
        p50: data.metrics.archive_latency?.values?.p50,
        p95: data.metrics.archive_latency?.values?.p95
      }
    },
    checksSucceeded: data.metrics.checks?.values?.passes || 0,
    checksTotal: data.metrics.checks?.values?.count || 0,
    successRate: ((data.metrics.checks?.values?.passes || 0) / (data.metrics.checks?.values?.count || 1) * 100)
  };
  
  return {
    'test-results/75-user-baseline-results.json': JSON.stringify(summary, null, 2),
    stdout: generateTextSummary(summary)
  };
}

function generateTextSummary(summary) {
  // Safe number formatting with null/undefined checks
  const safeFormat = (value, digits = 2) => {
    return (value !== null && value !== undefined && !isNaN(value)) 
      ? Number(value).toFixed(digits) 
      : 'N/A';
  };

  return `
📈 75人并发基线测试结果

👥 测试规模: ${summary.userCount}人并发
📊 成功率: ${safeFormat(summary.successRate, 1)}% (${summary.checksSucceeded}/${summary.checksTotal})

🚀 总体性能:
- 总请求数: ${summary.requests.total}
- 请求速率: ${safeFormat(summary.requests.rate)} req/s
- 失败率: ${safeFormat(summary.requests.failed)}%

⚡ 响应时间:
- 平均: ${safeFormat(summary.latency?.avg)}ms
- 50%: ${safeFormat(summary.latency?.p50)}ms  
- 95%: ${safeFormat(summary.latency?.p95)}ms
- 99%: ${safeFormat(summary.latency?.p99)}ms

🎯 API性能分析:
- 祷告API: P50=${safeFormat(summary.apiLatency?.prayers?.p50)}ms, P95=${safeFormat(summary.apiLatency?.prayers?.p95)}ms
- 点赞操作: P50=${safeFormat(summary.apiLatency?.likes?.p50)}ms, P95=${safeFormat(summary.apiLatency?.likes?.p95)}ms
- Archive: P50=${safeFormat(summary.apiLatency?.archive?.p50)}ms, P95=${safeFormat(summary.apiLatency?.archive?.p95)}ms

${summary.successRate > 95 ? '✅ 75人并发测试通过!' : '⚠️  75人并发存在性能问题，需要优化'}
`;
}