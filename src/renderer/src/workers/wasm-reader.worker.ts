/// <reference lib="webworker" />

import {
  initWasmReader,
  loadBook,
  loadBundledFonts,
  paginateBook,
  prerenderPages,
  renderPage,
  unloadBook,
  updateSettings,
} from '../services/WasmReaderService'
import {
  WasmReaderWorkerCommand,
  WasmReaderWorkerEvent,
  WasmReaderStage,
} from '../types/wasm-reader-worker.types'
import { WasmPaginationResult, WasmReaderSettings } from '../types/wasm-reader.types'

const workerScope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

let canvas: OffscreenCanvas | null = null
let context: OffscreenCanvasRenderingContext2D | null = null
let settings: WasmReaderSettings | null = null
let pagination: WasmPaginationResult | null = null
let width = 0
let height = 0
let pixelRatio = 1
let bookLoaded = false
let currentPage = 0
let pendingResume: { page: number; totalPages: number } | null = null
let prerenderTimer: ReturnType<typeof setTimeout> | null = null
let commandQueue = Promise.resolve()

function emit(event: WasmReaderWorkerEvent): void {
  workerScope.postMessage(event)
}

function emitStatus(requestId: number, stage: WasmReaderStage): void {
  emit({ type: 'status', requestId, stage })
}

function chapterLocation(pageIndex: number): {
  chapterId: string
  ratio: number
} | null {
  if (!pagination) return null
  const chapter = pagination.chapterPageMap.find(
    (entry) =>
      pageIndex >= entry.firstPageIndex && pageIndex < entry.firstPageIndex + entry.pageCount
  )
  if (!chapter) return null

  return {
    chapterId: chapter.chapterId,
    ratio:
      chapter.pageCount <= 1 ? 0 : (pageIndex - chapter.firstPageIndex) / (chapter.pageCount - 1),
  }
}

function restorePage(
  previousLocation: ReturnType<typeof chapterLocation>,
  result: WasmPaginationResult
): number {
  if (previousLocation) {
    const chapter = result.chapterPageMap.find(
      (entry) => entry.chapterId === previousLocation.chapterId
    )
    if (chapter) {
      return Math.min(
        result.totalPages - 1,
        chapter.firstPageIndex +
          Math.round(previousLocation.ratio * Math.max(0, chapter.pageCount - 1))
      )
    }
  }

  if (pendingResume && pendingResume.totalPages > 0 && result.totalPages > 0) {
    const ratio =
      pendingResume.totalPages <= 1 ? 0 : pendingResume.page / (pendingResume.totalPages - 1)
    return Math.round(ratio * Math.max(0, result.totalPages - 1))
  }

  return Math.min(Math.max(currentPage, 0), Math.max(0, result.totalPages - 1))
}

function repaginate(requestId: number, reflow: boolean): void {
  if (!bookLoaded || width <= 0 || height <= 0) return

  emitStatus(requestId, reflow ? 'reflowing' : 'paginating')
  const previousLocation = chapterLocation(currentPage)
  const result = paginateBook(width, height)
  currentPage = restorePage(previousLocation, result)
  pagination = result
  pendingResume = null
  emit({ type: 'pagination', requestId, result, pageIndex: currentPage })
}

function drawPage(requestId: number, pageIndex: number): void {
  if (!canvas || !context || !pagination || pagination.totalPages === 0) return

  currentPage = Math.min(Math.max(pageIndex, 0), pagination.totalPages - 1)
  emitStatus(requestId, 'rendering')

  const pixelWidth = Math.max(1, Math.round(width * pixelRatio))
  const pixelHeight = Math.max(1, Math.round(height * pixelRatio))
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight

  const pixels = renderPage(currentPage, width, height, pixelRatio)
  const imagePixels = new Uint8ClampedArray(pixels.length)
  imagePixels.set(pixels)
  const imageData = new ImageData(imagePixels, pixelWidth, pixelHeight)
  context.putImageData(imageData, 0, 0)
  emit({ type: 'rendered', requestId, pageIndex: currentPage })
  emitStatus(requestId, 'ready')

  if (prerenderTimer) clearTimeout(prerenderTimer)
  prerenderTimer = setTimeout(() => {
    prerenderPages(currentPage, width, height, pixelRatio, 1)
  }, 80)
}

async function handleCommand(command: WasmReaderWorkerCommand): Promise<void> {
  if (prerenderTimer) {
    clearTimeout(prerenderTimer)
    prerenderTimer = null
  }

  switch (command.type) {
    case 'initialize':
      emitStatus(command.requestId, 'initializing')
      canvas = command.canvas
      context = canvas.getContext('2d')
      if (!context) throw new Error('Could not create the reader canvas context')
      await initWasmReader()
      emitStatus(command.requestId, 'fonts')
      await loadBundledFonts()
      settings = command.settings
      updateSettings(settings)
      emit({ type: 'initialized', requestId: command.requestId })
      return

    case 'load-book':
      emitStatus(command.requestId, 'opening')
      unloadBook()
      loadBook(command.content)
      bookLoaded = true
      pagination = null
      pendingResume = { page: command.resumePage, totalPages: command.resumeTotalPages }
      currentPage = command.resumePage
      repaginate(command.requestId, false)
      return

    case 'resize':
      width = command.width
      height = command.height
      pixelRatio = Math.max(1, command.pixelRatio)
      repaginate(command.requestId, pagination !== null)
      return

    case 'update-settings': {
      settings = command.settings
      const result = updateSettings(settings)
      if (result.layoutChanged) {
        repaginate(command.requestId, pagination !== null)
      } else if (pagination) {
        drawPage(command.requestId, currentPage)
      }
      return
    }

    case 'render-page':
      drawPage(command.requestId, command.pageIndex)
      return

    case 'destroy':
      unloadBook()
      workerScope.close()
  }
}

workerScope.addEventListener('message', (event: MessageEvent<WasmReaderWorkerCommand>) => {
  const command = event.data
  commandQueue = commandQueue
    .then(() => handleCommand(command))
    .catch((error: unknown) => {
      emit({
        type: 'error',
        requestId: command.requestId,
        message: error instanceof Error ? error.message : String(error),
      })
    })
})
