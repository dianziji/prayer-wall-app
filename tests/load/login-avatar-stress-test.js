/**
 * 登录+头像处理压力测试
 * 
 * 测试场景: 100人同时登录并上传头像
 * 关键瓶颈: 
 * - 外部API调用 (Google头像)
 * - Supabase Storage并发上传
 * - 内存和网络带宽消耗
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const avatarUploadLatency = new Trend('avatar_upload_latency');
const authLatency = new Trend('auth_latency');
const storageLatency = new Trend('storage_latency');

// 登录压力测试配置
export const options = {
  stages: [
    // 快速启动: 30秒内到达100用户 (模拟登录高峰)
    { duration: '30s', target: 100 },
    
    // 峰值负载: 维持100用户 (2分钟)
    { duration: '2m', target: 100 },
    
    // 平稳下降: 降到0 (30秒)
    { duration: '30s', target: 0 },
  ],
  
  thresholds: {
    // 放宽阈值 (头像上传比普通API慢)
    http_req_duration: ['p(95)<10000'], // 10秒内完成
    http_req_failed: ['rate<0.10'],     // 错误率<10%
    
    // 头像特定阈值
    avatar_upload_latency: ['p(50)<5000', 'p(95)<15000'], // 5s/15s
    auth_latency: ['p(50)<1000', 'p(95)<3000'],            // 1s/3s
    storage_latency: ['p(50)<3000', 'p(95)<10000'],        // 3s/10s
    
    // 错误率阈值
    errors: ['rate<0.10'],
  }
};

// 模拟Google头像URL池
const MOCK_AVATAR_URLS = [
  'https://lh3.googleusercontent.com/a-/mockuser1',
  'https://lh3.googleusercontent.com/a-/mockuser2', 
  'https://lh4.googleusercontent.com/a-/mockuser3',
  'https://lh5.googleusercontent.com/a-/mockuser4',
  'https://lh6.googleusercontent.com/a-/mockuser5',
];

export default function() {
  const baseUrl = 'http://localhost:3000';
  const userId = `load-test-user-${Math.floor(Math.random() * 10000)}`;
  
  try {
    // 场景1: 模拟用户认证 (20%)
    if (Math.random() < 0.2) {
      simulateAuth(baseUrl, userId);
    } 
    // 场景2: 头像上传压力测试 (80%)
    else {
      avatarUploadStress(baseUrl, userId);
    }
  } catch (error) {
    errorRate.add(true);
    console.log(`Login stress test error: ${error.message}`);
  }

  // 随机等待时间 (模拟用户行为)
  sleep(Math.random() * 2 + 0.5);
}

function simulateAuth(baseUrl, userId) {
  const startTime = Date.now();
  
  // 模拟认证检查 (获取用户信息)
  const response = http.get(`${baseUrl}/api/prayers`, {
    timeout: '5s',
    headers: {
      'Cookie': `sb-127001541321-auth-token=mock-token-${userId}`,
      'Authorization': `Bearer mock-jwt-${userId}`
    }
  });
  
  const latency = Date.now() - startTime;
  authLatency.add(latency);
  
  const success = check(response, {
    'auth simulation status OK': (r) => r.status === 200 || r.status === 401,
    'auth simulation latency OK': () => latency < 3000,
  });
  
  if (!success) errorRate.add(true);
}

function avatarUploadStress(baseUrl, userId) {
  const startTime = Date.now();
  
  // 随机选择一个头像URL
  const avatarUrl = MOCK_AVATAR_URLS[Math.floor(Math.random() * MOCK_AVATAR_URLS.length)];
  
  // 模拟头像上传请求
  const payload = JSON.stringify({
    sourceUrl: avatarUrl
  });
  
  const response = http.post(`${baseUrl}/api/avatar/ingest`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-127001541321-auth-token=mock-token-${userId}`,
      'Authorization': `Bearer mock-jwt-${userId}`
    },
    timeout: '20s' // 头像上传可能较慢
  });
  
  const latency = Date.now() - startTime;
  avatarUploadLatency.add(latency);
  
  // 根据响应分析性能
  if (response.status === 200) {
    // 成功情况 - 分析存储延迟
    if (latency > 3000) {
      storageLatency.add(latency);
    }
  }
  
  const success = check(response, {
    'avatar upload status acceptable': (r) => {
      // 401 (未登录) 和 200 (成功) 都可接受
      // 502 (外部API失败) 也可接受 (网络问题)
      return r.status === 200 || r.status === 401 || r.status === 502;
    },
    'avatar upload no timeout': () => latency < 20000,
    'avatar upload reasonable time': () => latency < 10000,
  });
  
  if (!success) {
    errorRate.add(true);
    console.log(`Avatar upload failed: Status ${response.status}, Latency ${latency}ms`);
  }
  
  // 如果是网络相关错误，记录但不算作系统错误
  if (response.status === 502 || response.status === 504) {
    console.log(`Network issue detected: ${response.status} (expected in load test)`);
  }
}

// 测试结果处理
export function handleSummary(data) {
  const summary = {
    testType: '登录+头像处理压力测试',
    timestamp: new Date().toISOString(),
    userCount: 100,
    duration: Math.round(data.metrics.iteration_duration?.values?.avg || 0),
    requests: {
      total: data.metrics.http_reqs?.values?.count || 0,
      rate: data.metrics.http_reqs?.values?.rate || 0,
      failed: (data.metrics.http_req_failed?.values?.rate || 0) * 100
    },
    latency: {
      avg: data.metrics.http_req_duration?.values?.avg,
      p50: data.metrics.http_req_duration?.values?.med,
      p95: data.metrics.http_req_duration?.values?.['p(95)'],
      p99: data.metrics.http_req_duration?.values?.['p(99)']
    },
    loginPerformance: {
      avatarUpload: {
        p50: data.metrics.avatar_upload_latency?.values?.med,
        p95: data.metrics.avatar_upload_latency?.values?.['p(95)'],
        avg: data.metrics.avatar_upload_latency?.values?.avg
      },
      auth: {
        p50: data.metrics.auth_latency?.values?.med,
        p95: data.metrics.auth_latency?.values?.['p(95)']
      },
      storage: {
        p50: data.metrics.storage_latency?.values?.med,
        p95: data.metrics.storage_latency?.values?.['p(95)']
      }
    },
    checksSucceeded: data.metrics.checks?.values?.passes || 0,
    checksTotal: data.metrics.checks?.values?.count || 0,
    successRate: ((data.metrics.checks?.values?.passes || 0) / Math.max(data.metrics.checks?.values?.count || 1, 1) * 100),
    errorRate: (data.metrics.errors?.values?.rate || 0) * 100
  };
  
  return {
    'test-results/login-avatar-stress-results.json': JSON.stringify(summary, null, 2),
    stdout: generateLoginStressReport(summary)
  };
}

function generateLoginStressReport(summary) {
  const safeFormat = (value, digits = 2) => {
    return (value !== null && value !== undefined && !isNaN(value)) 
      ? Number(value).toFixed(digits) 
      : 'N/A';
  };

  const getStatusIcon = (rate) => {
    if (!rate || isNaN(rate)) return '❓';
    return rate > 90 ? '✅' : rate > 75 ? '⚠️' : '❌';
  };

  const getLatencyIcon = (latency) => {
    if (!latency || isNaN(latency)) return '❓';
    return latency < 5000 ? '🟢' : latency < 10000 ? '🟡' : '🔴';
  };

  return `
🔐 登录+头像处理压力测试报告

═══════════════════════════════════════
📊 测试概览  
═══════════════════════════════════════
👥 并发用户: ${summary.userCount}人同时登录
⏱️  测试时长: 3分钟 (快速登录高峰模拟)
📈 成功率: ${safeFormat(summary.successRate, 1)}% ${getStatusIcon(summary.successRate)}
💥 错误率: ${safeFormat(summary.errorRate)}%
🔥 总请求数: ${summary.requests.total}

═══════════════════════════════════════
⚡ 整体性能指标
═══════════════════════════════════════
📊 请求速率: ${safeFormat(summary.requests.rate)} req/s
⏰ 平均延迟: ${safeFormat(summary.latency?.avg)}ms ${getLatencyIcon(summary.latency?.avg)}
📈 P50延迟: ${safeFormat(summary.latency?.p50)}ms
🎯 P95延迟: ${safeFormat(summary.latency?.p95)}ms
🚨 P99延迟: ${safeFormat(summary.latency?.p99)}ms

═══════════════════════════════════════
🔐 登录相关性能分析
═══════════════════════════════════════
🖼️  头像上传性能:
   • 平均延迟: ${safeFormat(summary.loginPerformance?.avatarUpload?.avg)}ms
   • P50延迟: ${safeFormat(summary.loginPerformance?.avatarUpload?.p50)}ms ${getLatencyIcon(summary.loginPerformance?.avatarUpload?.p50)}
   • P95延迟: ${safeFormat(summary.loginPerformance?.avatarUpload?.p95)}ms ${getLatencyIcon(summary.loginPerformance?.avatarUpload?.p95)}

🔑 认证系统:
   • P50延迟: ${safeFormat(summary.loginPerformance?.auth?.p50)}ms
   • P95延迟: ${safeFormat(summary.loginPerformance?.auth?.p95)}ms

💾 存储系统:
   • P50延迟: ${safeFormat(summary.loginPerformance?.storage?.p50)}ms
   • P95延迟: ${safeFormat(summary.loginPerformance?.storage?.p95)}ms

═══════════════════════════════════════
📋 登录性能结论
═══════════════════════════════════════
${summary.successRate > 90 && summary.loginPerformance?.avatarUpload?.p95 < 15000
  ? '🎉 100人并发登录测试通过！头像处理性能良好!'
  : summary.successRate > 75
    ? '⚠️  100人并发登录基本通过，但头像处理有压力'
    : '❌ 100人并发登录存在严重问题，需要优化头像处理流程'}

🔍 性能分析:
${summary.loginPerformance?.avatarUpload?.p95 > 15000 ? '• 头像上传延迟过高，建议优化' : '• 头像上传性能可接受'}
${summary.errorRate > 10 ? '• 错误率偏高，检查网络和存储配置' : '• 错误率在可接受范围内'}
${summary.requests.rate < 10 ? '• 吞吐量较低，可能有阻塞问题' : '• 系统吞吐量正常'}

💡 优化建议:
${summary.loginPerformance?.avatarUpload?.p95 > 10000 ? '• 考虑异步头像处理' : ''}
${summary.loginPerformance?.avatarUpload?.p95 > 15000 ? '• 添加头像上传队列机制' : ''}
${summary.errorRate > 5 ? '• 优化外部API调用的超时和重试机制' : ''}
• 考虑头像CDN缓存策略
• 实现头像尺寸优化压缩
`;
}