/**
 * 图片压缩和优化工具
 * 
 * 使用Sharp进行高效的图片处理:
 * - 压缩文件大小
 * - 标准化尺寸 
 * - 格式转换
 * - 质量优化
 */

import sharp from 'sharp'

interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'auto'
  maxSize?: number // 最大文件大小 (bytes)
}

interface OptimizeResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
  originalSize: number
  compressionRatio: number
}

/**
 * 优化头像图片
 * 默认: 128x128, WebP格式, 80%质量
 */
export async function optimizeAvatar(inputBuffer: Buffer, options: OptimizeOptions = {}): Promise<OptimizeResult> {
  const {
    maxWidth = 128,
    maxHeight = 128,
    quality = 80,
    format = 'webp',
    maxSize = 50 * 1024 // 50KB
  } = options

  const originalSize = inputBuffer.length
  
  try {
    let pipeline = sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'cover',
        position: 'center'
      })

    // 根据格式应用优化
    let outputFormat = format
    if (format === 'auto') {
      // 自动选择最优格式
      outputFormat = originalSize > 100 * 1024 ? 'webp' : 'jpeg'
    }

    switch (outputFormat) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 })
        break
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true })
        break
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, palette: true })
        break
    }

    let result = await pipeline.toBuffer({ resolveWithObject: true })
    let { data: buffer, info } = result

    // 如果文件还是太大，进一步压缩
    if (buffer.length > maxSize && quality > 30) {
      const newQuality = Math.max(30, quality - 20)
      console.log(`Further compressing avatar: ${buffer.length} bytes > ${maxSize} bytes, reducing quality to ${newQuality}%`)
      
      pipeline = sharp(inputBuffer)
        .resize(maxWidth, maxHeight, { fit: 'cover', position: 'center' })

      switch (outputFormat) {
        case 'webp':
          pipeline = pipeline.webp({ quality: newQuality, effort: 6 })
          break
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: newQuality, mozjpeg: true })
          break
        case 'png':
          // PNG不支持质量参数，尝试更小的尺寸
          pipeline = pipeline
            .resize(Math.floor(maxWidth * 0.8), Math.floor(maxHeight * 0.8))
            .png({ compressionLevel: 9, palette: true })
          break
      }

      result = await pipeline.toBuffer({ resolveWithObject: true })
      buffer = result.data
      info = result.info
    }

    const compressionRatio = ((originalSize - buffer.length) / originalSize * 100)

    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      size: buffer.length,
      originalSize,
      compressionRatio
    }

  } catch (error) {
    console.error('Image optimization failed:', error)
    throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 验证图片格式和基本信息
 */
export async function validateImage(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata()
    
    const supportedFormats = ['jpeg', 'png', 'webp', 'gif']
    if (!metadata.format || !supportedFormats.includes(metadata.format)) {
      throw new Error(`Unsupported image format: ${metadata.format}`)
    }

    // 检查尺寸合理性
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions')
    }

    if (metadata.width > 5000 || metadata.height > 5000) {
      throw new Error('Image dimensions too large (max 5000x5000)')
    }

    if (metadata.width < 16 || metadata.height < 16) {
      throw new Error('Image dimensions too small (min 16x16)')
    }

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      isAnimated: metadata.pages && metadata.pages > 1
    }

  } catch (error) {
    console.error('Image validation failed:', error)
    throw new Error(`Invalid image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 生成多种尺寸的头像 (可选功能)
 */
export async function generateAvatarSizes(inputBuffer: Buffer) {
  const sizes = [
    { name: 'small', size: 64 },
    { name: 'medium', size: 128 },
    { name: 'large', size: 256 }
  ]

  const results = await Promise.all(
    sizes.map(async ({ name, size }) => {
      const optimized = await optimizeAvatar(inputBuffer, {
        maxWidth: size,
        maxHeight: size,
        quality: 85,
        format: 'webp'
      })
      
      return {
        name,
        size,
        ...optimized
      }
    })
  )

  return results
}

/**
 * 检查图片是否需要优化
 */
export function needsOptimization(metadata: { width: number, height: number, size: number, format: string }): boolean {
  const { width, height, size, format } = metadata
  
  // 尺寸过大
  if (width > 512 || height > 512) return true
  
  // 文件过大 (超过200KB)
  if (size > 200 * 1024) return true
  
  // 格式不是WebP且文件较大 (超过50KB)
  if (format !== 'webp' && size > 50 * 1024) return true
  
  return false
}