/**
 * 获取应用的基础URL，支持所有环境（生产/预览/开发）
 */
export function getAppOrigin(): string {
  // 客户端环境：直接使用当前页面的origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // 服务端环境：优先使用环境变量，否则使用默认生产域名
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl && siteUrl.startsWith('http')) {
    return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
  }
  
  // 兜底：默认生产域名
  return 'https://prayer-wall-app.vercel.app'
}

/**
 * 获取OAuth回调URL
 */
export function getOAuthCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`
}