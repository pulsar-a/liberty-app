import { ImageDimension, ContainerDimensions } from '@app-types/reader.types'

/**
 * Utility service for preloading images and calculating their dimensions.
 * This is crucial for accurate content fitting since images take up significant space.
 */
export class ImagePreloader {
  private cache: Map<string, ImageDimension> = new Map()
  private loadingPromises: Map<string, Promise<ImageDimension>> = new Map()

  /**
   * Extract all image URLs from HTML content
   */
  extractImageUrls(html: string): string[] {
    const urls: string[] = []
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match: RegExpExecArray | null

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1]
      if (src && !urls.includes(src)) {
        urls.push(src)
      }
    }

    return urls
  }

  /**
   * Preload a single image and get its dimensions
   */
  async preloadImage(src: string): Promise<ImageDimension> {
    // Check cache first
    const cached = this.cache.get(src)
    if (cached) {
      return cached
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(src)
    if (existingPromise) {
      return existingPromise
    }

    // Create new loading promise
    const loadPromise = new Promise<ImageDimension>((resolve) => {
      const img = new Image()

      img.onload = () => {
        const dimension: ImageDimension = {
          src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          loaded: true,
        }
        this.cache.set(src, dimension)
        this.loadingPromises.delete(src)
        resolve(dimension)
      }

      img.onerror = () => {
        const dimension: ImageDimension = {
          src,
          naturalWidth: 0,
          naturalHeight: 0,
          loaded: false,
          error: `Failed to load image: ${src}`,
        }
        this.cache.set(src, dimension)
        this.loadingPromises.delete(src)
        resolve(dimension)
      }

      // Handle data URLs, absolute URLs, and relative URLs
      img.src = src
    })

    this.loadingPromises.set(src, loadPromise)
    return loadPromise
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Map<string, ImageDimension>> {
    const results = new Map<string, ImageDimension>()
    let loaded = 0
    const total = urls.length

    if (total === 0) {
      return results
    }

    const promises = urls.map(async (url) => {
      const dimension = await this.preloadImage(url)
      loaded++
      onProgress?.(loaded, total)
      results.set(url, dimension)
    })

    await Promise.all(promises)
    return results
  }

  /**
   * Preload all images from HTML content
   */
  async preloadImagesFromHtml(
    html: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Map<string, ImageDimension>> {
    const urls = this.extractImageUrls(html)
    return this.preloadImages(urls, onProgress)
  }

  /**
   * Calculate scaled dimensions for an image to fit within container constraints
   * while maintaining aspect ratio
   */
  calculateScaledDimensions(
    naturalWidth: number,
    naturalHeight: number,
    containerDimensions: ContainerDimensions,
    maxWidthPercent: number = 100,
    maxHeightPercent: number = 80
  ): { width: number; height: number } {
    if (naturalWidth === 0 || naturalHeight === 0) {
      return { width: 0, height: 0 }
    }

    const maxWidth = (containerDimensions.width * maxWidthPercent) / 100
    const maxHeight = (containerDimensions.height * maxHeightPercent) / 100
    const aspectRatio = naturalWidth / naturalHeight

    let width = naturalWidth
    let height = naturalHeight

    // Scale down if wider than container
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }

    // Scale down further if taller than max height
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  /**
   * Get the cached dimension for an image
   */
  getCachedDimension(src: string): ImageDimension | undefined {
    return this.cache.get(src)
  }

  /**
   * Check if an image is already cached
   */
  isCached(src: string): boolean {
    return this.cache.has(src)
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader()

/**
 * Hook-friendly function to preload images from HTML
 */
export async function preloadImagesFromContent(
  html: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, ImageDimension>> {
  return imagePreloader.preloadImagesFromHtml(html, onProgress)
}

/**
 * Calculate the estimated height an image will occupy on a page
 * including margins
 */
export function estimateImageHeight(
  imageDimension: ImageDimension,
  containerDimensions: ContainerDimensions,
  marginTop: number = 24, // 1.5em at 16px base
  marginBottom: number = 24
): number {
  if (!imageDimension.loaded || imageDimension.naturalHeight === 0) {
    // Return a placeholder height for failed images
    return 100 + marginTop + marginBottom
  }

  const scaled = imagePreloader.calculateScaledDimensions(
    imageDimension.naturalWidth,
    imageDimension.naturalHeight,
    containerDimensions
  )

  return scaled.height + marginTop + marginBottom
}

