/**
 * WeChat Browser Detection and URL Utilities
 * Handles WeChat WebView limitations for OAuth flows
 */

/**
 * Detect if user is browsing within WeChat's built-in browser
 * @returns true if in WeChat WebView environment
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('micromessenger')
}

/**
 * Detect if user is browsing within any mobile app's WebView
 * @returns true if in any WebView environment
 */
export function isWebView(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  // Common WebView indicators
  return (
    userAgent.includes('micromessenger') ||  // WeChat
    userAgent.includes('qq/') ||             // QQ
    userAgent.includes('weibo') ||           // Weibo
    userAgent.includes('alipay') ||          // Alipay
    // Note: Avoid detecting regular mobile Safari as WebView
    // Regular Safari has "Version/X.X Mobile/XXX Safari/XXX" pattern
    // WebView Safari usually lacks the "Version/" part or has different patterns
    (userAgent.includes('mobile') && userAgent.includes('safari/') && !userAgent.includes('version/'))
  )
}

/**
 * Generate URL to open current page in external browser
 * For WeChat users, this creates a universal link that opens in default browser
 * @param targetPath Optional specific path to open (defaults to current page)
 * @returns URL string for opening in external browser
 */
export function getOpenInBrowserUrl(targetPath?: string): string {
  if (typeof window === 'undefined') return targetPath || '/'
  
  const currentUrl = new URL(window.location.href)
  const targetUrl = targetPath ? `${currentUrl.origin}${targetPath}` : currentUrl.href
  
  // For WeChat, we can use various methods to encourage external browser opening
  // Method 1: Direct URL (user needs to manually copy or use "Open in Browser" menu)
  return targetUrl
}

/**
 * Generate instructions text based on detected environment
 * @param lang Language preference ('zh' | 'en')
 * @returns Object with instruction texts
 */
export function getWeChatInstructions(lang: 'zh' | 'en' = 'zh') {
  if (lang === 'en') {
    return {
      title: 'WeChat Browser Detected',
      subtitle: 'Google Login requires external browser',
      instruction: 'Please tap the menu (•••) in the top-right corner and select "Open in Browser" to continue with Google login.',
      copyUrlText: 'Or copy this URL to your browser:',
      copyButtonText: 'Copy URL',
      copiedText: 'Copied!',
      alternativeText: 'Having trouble? You can also manually copy the URL from the address bar.'
    }
  }
  
  return {
    title: '检测到微信浏览器',
    subtitle: 'Google 登录需要在外部浏览器中进行',
    instruction: '请点击右上角菜单（•••），选择"在浏览器中打开"以继续 Google 登录。',
    copyUrlText: '或者复制此链接到浏览器中：',
    copyButtonText: '复制链接',
    copiedText: '已复制！',
    alternativeText: '遇到问题？您也可以手动从地址栏复制网址。'
  }
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise<boolean> Success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}