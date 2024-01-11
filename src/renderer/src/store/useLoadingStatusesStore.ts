import { create } from 'zustand'

export type LoadingStatusItem = {
  id: string | number
  title: string
  icon?: 'file' | 'task' | 'data'
  status: 'loading' | 'success' | 'error'
  errorMessage?: string
  successMessage?: string
  determined?: boolean
  percentage?: number
}

type LoadingStatusesState = {
  items: LoadingStatusItem[]
}

export const useLoadingStatusesStore = create<LoadingStatusesState>((set) => ({
  items: [
    {
      id: 1,
      title: 'Uploading "Reliquary.epub"',
      icon: 'file',
      status: 'loading',
    },
    {
      id: 2,
      title:
        'File format is not known to humanbeing, but we will keep trying it untill the end of the world. lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      icon: 'file',
      status: 'error',
    },
    {
      id: 3,
      title: 'Uploaded successfully',
      icon: 'task',
      status: 'success',
    },
  ],
  addItem: (item: LoadingStatusItem) => set((state) => ({ items: [...state.items, item] })),
  setItemStatus: (id: string | number, status: LoadingStatusItem['status']) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          return { ...item, status }
        }
        return item
      }),
    })),
  setItemPercentage: (id: string | number, percentage: number) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          return { ...item, percentage }
        }
        return item
      }),
    })),
  removeItem: (id: string | number) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}))
