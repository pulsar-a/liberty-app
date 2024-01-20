import { LoadingStatusItem } from '@app-types/loader.types'
import { create } from 'zustand'

type LoadingStatusesState = {
  items: LoadingStatusItem[]
}
type LoadingStatusesMethods = {
  addItem: (item: LoadingStatusItem) => void
  setItemStatus: (
    id: string | number,
    status: LoadingStatusItem['status'],
    label?: string,
    subLabel?: string
  ) => void
  removeItem: (id: string | number) => void
  clearFinished: () => void
}

export const useLoadingStatusesStore = create<LoadingStatusesState & LoadingStatusesMethods>(
  (set) => ({
    items: [
      // {
      //   id: 1,
      //   label: 'Uploading "Reliquary.epub"',
      //   status: 'loading',
      // },
      // {
      //   id: 2,
      //   label:
      //     'File format is not known to humanbeing, but we will keep trying it untill the end of the world. lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      //   status: 'error',
      // },
      // {
      //   id: 1,
      //   label: 'Uploading "Reliquary.epub"',
      //   status: 'loading',
      // },
      // {
      //   id: 2,
      //   label: 'No uploaded: "Reliquary.epub"',
      //   subLabel: 'File format is not supported',
      //   status: 'error',
      // },
      // {
      //   id: 3,
      //   label: 'Uploaded successfully',
      //   status: 'success',
      // },
      // {
      //   id: 4,
      //   label: 'Uploading "Reliquary.epub"',
      //   status: 'loading',
      // },
      // {
      //   id: 5,
      //   label:
      //     'File format is not known to humanbeing, but we will keep trying it untill the end of the world. lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      //   icon: 'file',
      //   status: 'error',
      // },
      // {
      //   id: 6,
      //   label: 'Uploaded successfully',
      //   status: 'success',
      // },
      // {
      //   id: 7,
      //   label: 'Uploading "Reliquary.epub"',
      //   status: 'loading',
      // },
      // {
      //   id: 8,
      //   label:
      //     'File format is not known to humanbeing, but we will keep trying it untill the end of the world. lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      //   status: 'error',
      // },
      // {
      //   id: 9,
      //   label: 'Uploaded successfully',
      //   icon: 'task',
      //   status: 'success',
      // },
      // {
      //   id: 10,
      //   label: 'Uploading "Reliquary.epub"',
      //   status: 'loading',
      // },
      // {
      //   id: 11,
      //   label:
      //     'File format is not known to humanbeing, but we will keep trying it untill the end of the world. lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      //   status: 'error',
      // },
      // {
      //   id: 12,
      //   label: 'Uploaded successfully',
      //   status: 'success',
      // },
    ],
    addItem: (item: LoadingStatusItem) => set((state) => ({ items: [...state.items, item] })),
    setItemStatus: (id: string | number, status: LoadingStatusItem['status'], label, subLabel) =>
      set((state) => ({
        items: state.items.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status,
              ...(label ? { label } : {}),
              ...(subLabel ? { subLabel } : {}),
            }
          }
          return item
        }),
      })),
    removeItem: (id: string | number) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
    clearFinished: () =>
      set((state) => ({
        items: state.items.filter((item) => item.status === 'loading'),
      })),
  })
)

export const grabSortedItems = ({ items }: LoadingStatusesState & LoadingStatusesMethods) => {
  return items.sort((a, b) => {
    if (['success', 'error'].includes(a.status)) {
      return 1
    }
    if (['success', 'error'].includes(b.status)) {
      return -1
    }

    return 0
  })
}
