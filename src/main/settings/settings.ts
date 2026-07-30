import Store, { type Schema } from 'electron-store'
import { z } from 'zod'
import type { SettingKeys, SettingsType } from '../../../types/settings.types'

const schema: Schema<SettingsType> = {
  theme: {
    type: 'string',
    default: 'system',
  },
  language: {
    type: 'string',
    default: 'en',
  },
  userFilesDir: {
    type: 'string',
    default: '',
  },
  currentlyReading: {
    type: ['number', 'null'],
    default: null,
  },
  confirmRemoveFromCollection: {
    type: 'boolean',
    default: true,
  },
  confirmDeleteBook: {
    type: 'boolean',
    default: true,
  },
  confirmLastBookFileRemoval: {
    type: 'boolean',
    default: true,
  },
  lastBookFileRemovalAction: {
    type: 'string',
    enum: ['keepBook', 'deleteBook'],
    default: 'keepBook',
  },
  libraryViewStyle: {
    type: 'string',
    enum: ['list', 'grid'],
    default: 'grid',
  },
}

export const settingValueSchemas: { [Key in SettingKeys]: z.ZodType<SettingsType[Key]> } = {
  language: z.string().min(2).max(10),
  theme: z.enum(['light', 'dark', 'system']),
  userFilesDir: z.string(),
  currentlyReading: z.number().int().positive().nullable(),
  libraryViewStyle: z.enum(['list', 'grid']),
  confirmRemoveFromCollection: z.boolean(),
  confirmDeleteBook: z.boolean(),
  confirmLastBookFileRemoval: z.boolean(),
  lastBookFileRemovalAction: z.enum(['keepBook', 'deleteBook']),
}

export const isSettingKey = (value: unknown): value is SettingKeys =>
  typeof value === 'string' && value in settingValueSchemas

export const settings = new Store<SettingsType>({ schema })
