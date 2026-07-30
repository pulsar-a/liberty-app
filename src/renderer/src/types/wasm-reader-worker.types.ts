import { BookContent } from '@app-types/reader.types'
import { WasmPaginationResult, WasmReaderSettings } from './wasm-reader.types'

export type WasmReaderStage =
  | 'initializing'
  | 'fonts'
  | 'opening'
  | 'paginating'
  | 'rendering'
  | 'reflowing'
  | 'ready'

interface WorkerCommandBase {
  requestId: number
}

export type WasmReaderWorkerCommand =
  | (WorkerCommandBase & {
      type: 'initialize'
      canvas: OffscreenCanvas
      settings: WasmReaderSettings
    })
  | (WorkerCommandBase & {
      type: 'load-book'
      content: BookContent
      resumePage: number
      resumeTotalPages: number
    })
  | (WorkerCommandBase & {
      type: 'resize'
      width: number
      height: number
      pixelRatio: number
    })
  | (WorkerCommandBase & {
      type: 'update-settings'
      settings: WasmReaderSettings
    })
  | (WorkerCommandBase & {
      type: 'render-page'
      pageIndex: number
    })
  | (WorkerCommandBase & {
      type: 'destroy'
    })

export type WasmReaderWorkerEvent =
  | {
      type: 'status'
      requestId: number
      stage: WasmReaderStage
    }
  | {
      type: 'initialized'
      requestId: number
    }
  | {
      type: 'pagination'
      requestId: number
      result: WasmPaginationResult
      pageIndex: number
    }
  | {
      type: 'rendered'
      requestId: number
      pageIndex: number
    }
  | {
      type: 'error'
      requestId: number
      message: string
    }
