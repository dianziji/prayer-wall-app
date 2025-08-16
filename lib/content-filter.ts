// Content filtering utility for prayer submissions
// Filters inappropriate language in both Chinese and English

// English inappropriate words (basic list - can be expanded)
const ENGLISH_INAPPROPRIATE_WORDS = [
  'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'crap',
  'stupid', 'idiot', 'moron', 'dumb', 'hate', 'kill', 'die',
  'death', 'murder', 'violence', 'drug', 'porn', 'sex',
  // Add more as needed
]

// Chinese inappropriate words that should be blocked in all contexts
const CHINESE_ALWAYS_INAPPROPRIATE = [
  '你妈', '傻逼', '白痴', '滚蛋', '该死', '见鬼', '混蛋', '王八蛋', 
  '畜生', '垃圾', '废物', '脑残', '智障', '煞笔', '傻比', '草泥马', 
  '去死', '找死', '毒品', '色情'
]

// Chinese words that are only inappropriate when used alone or in certain contexts
const CHINESE_CONTEXT_SENSITIVE = [
  { word: '操', allowedInWords: ['操作', '操心', '操练', '体操', '早操'] },
  { word: '死', allowedInWords: ['死亡', '去世', '逝世', '不死', '永生不死', '死海', '死角'] },
  { word: '杀', allowedInWords: ['杀菌', '杀毒', '自杀', '杀死'] },
  { word: '恨', allowedInWords: ['仇恨', '憎恨', '怨恨'] },
  { word: '滚', allowedInWords: ['滚动', '翻滚', '滚轮', '滚筒'] },
  { word: '蠢', allowedInWords: ['愚蠢', '笨蠢'] }
]

// Words that might be inappropriate in religious context
const RELIGIOUS_INAPPROPRIATE_WORDS: string[] = [
  // Currently empty - can add religious inappropriate words if needed
]

// Combine always inappropriate words
const ALL_ALWAYS_INAPPROPRIATE = [
  ...ENGLISH_INAPPROPRIATE_WORDS,
  ...CHINESE_ALWAYS_INAPPROPRIATE,
  // ...RELIGIOUS_INAPPROPRIATE_WORDS
]

export interface ContentFilterResult {
  isValid: boolean
  reason?: string
  detectedWords?: string[]
}

/**
 * Check if a context-sensitive word is used appropriately
 * @param content - The full content
 * @param sensitiveWord - The context-sensitive word config
 * @returns boolean indicating if the word usage is appropriate
 */
function isContextAppropriate(content: string, sensitiveWord: { word: string; allowedInWords: string[] }): boolean {
  const normalizedContent = content.toLowerCase()
  const word = sensitiveWord.word.toLowerCase()
  
  // Find all occurrences of the word
  const regex = new RegExp(word, 'gi')
  const matches = normalizedContent.match(regex)
  
  if (!matches) return true // Word not found, so it's fine
  
  // Check if every occurrence is within an allowed context
  for (const allowedWord of sensitiveWord.allowedInWords) {
    if (normalizedContent.includes(allowedWord.toLowerCase())) {
      return true // Found in allowed context
    }
  }
  
  // Check if the word appears alone (surrounded by spaces, punctuation, or at boundaries)
  const wordBoundaryRegex = new RegExp(`\\b${word}\\b`, 'gi')
  const boundaryMatches = normalizedContent.match(wordBoundaryRegex)
  
  // If word appears as standalone, it's inappropriate
  if (boundaryMatches && boundaryMatches.length > 0) {
    return false
  }
  
  return true // Word appears in some context, assume it's okay
}

/**
 * Filter content for inappropriate language
 * @param content - The text content to filter
 * @returns ContentFilterResult with validation result
 */
export function filterContent(content: string): ContentFilterResult {
  if (!content || typeof content !== 'string') {
    return { isValid: true }
  }

  const normalizedContent = content.toLowerCase().trim()
  const detectedWords: string[] = []

  // Check for always inappropriate words
  for (const word of ALL_ALWAYS_INAPPROPRIATE) {
    const normalizedWord = word.toLowerCase()
    if (normalizedContent.includes(normalizedWord)) {
      detectedWords.push(word)
    }
  }
  
  // Check context-sensitive Chinese words
  for (const sensitiveWord of CHINESE_CONTEXT_SENSITIVE) {
    if (!isContextAppropriate(content, sensitiveWord)) {
      detectedWords.push(sensitiveWord.word)
    }
  }

  // Check for suspicious patterns (optional)
  const suspiciousPatterns = [
    /f+u+c+k+/gi,           // variations of "fuck"
    /s+h+i+t+/gi,           // variations of "shit"
    /d+a+m+n+/gi,           // variations of "damn"
    /傻+逼+/gi,              // Chinese curse variations
  ]

  for (const pattern of suspiciousPatterns) {
    const matches = normalizedContent.match(pattern)
    if (matches) {
      detectedWords.push(...matches)
    }
  }

  if (detectedWords.length > 0) {
    return {
      isValid: false,
      reason: '您的内容包含不当词汇，请修改后重新提交',
      detectedWords: [...new Set(detectedWords)] // Remove duplicates
    }
  }

  return { isValid: true }
}

/**
 * Clean content by replacing inappropriate words with asterisks
 * @param content - The text content to clean
 * @returns Cleaned content with inappropriate words replaced
 */
export function cleanContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return content
  }

  let cleanedContent = content

  // Clean always inappropriate words
  for (const word of ALL_ALWAYS_INAPPROPRIATE) {
    const regex = new RegExp(word, 'gi')
    const replacement = '*'.repeat(word.length)
    cleanedContent = cleanedContent.replace(regex, replacement)
  }
  
  // Clean context-sensitive words only when inappropriate
  for (const sensitiveWord of CHINESE_CONTEXT_SENSITIVE) {
    if (!isContextAppropriate(content, sensitiveWord)) {
      const wordBoundaryRegex = new RegExp(`\\b${sensitiveWord.word}\\b`, 'gi')
      const replacement = '*'.repeat(sensitiveWord.word.length)
      cleanedContent = cleanedContent.replace(wordBoundaryRegex, replacement)
    }
  }

  return cleanedContent
}

/**
 * Check if content is appropriate for religious context
 * @param content - The text content to check
 * @returns boolean indicating if content is appropriate
 */
export function isAppropriateForReligiousContext(content: string): boolean {
  const result = filterContent(content)
  return result.isValid
}