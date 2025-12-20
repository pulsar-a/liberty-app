import { create } from 'zustand'

export type SearchFilter = 'books' | 'collections' | 'book_ids' | 'file_names' | 'internal_file_names'
export type BookFormat = 'epub' | 'pdf' | 'fb2' | 'fb3' | 'txt'

interface SearchState {
  // Global search term (shared between header and search page)
  searchTerm: string
  setSearchTerm: (term: string) => void
  
  // Search filters (for search page)
  filters: SearchFilter[]
  setFilters: (filters: SearchFilter[]) => void
  toggleFilter: (filter: SearchFilter) => void
  
  // Format filters (for search page)
  formats: BookFormat[]
  setFormats: (formats: BookFormat[]) => void
  toggleFormat: (format: BookFormat) => void
  
  // Dropdown visibility
  isDropdownOpen: boolean
  setDropdownOpen: (open: boolean) => void
  
  // Reset all filters
  resetFilters: () => void
}

const DEFAULT_FILTERS: SearchFilter[] = ['books', 'collections']
const DEFAULT_FORMATS: BookFormat[] = []

export const useSearchStore = create<SearchState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set({ filters }),
  toggleFilter: (filter) =>
    set((state) => {
      const hasFilter = state.filters.includes(filter)
      if (hasFilter) {
        // Don't allow removing all filters
        if (state.filters.length === 1) return state
        return { filters: state.filters.filter((f) => f !== filter) }
      }
      return { filters: [...state.filters, filter] }
    }),
  
  formats: DEFAULT_FORMATS,
  setFormats: (formats) => set({ formats }),
  toggleFormat: (format) =>
    set((state) => {
      const hasFormat = state.formats.includes(format)
      if (hasFormat) {
        return { formats: state.formats.filter((f) => f !== format) }
      }
      return { formats: [...state.formats, format] }
    }),
  
  isDropdownOpen: false,
  setDropdownOpen: (open) => set({ isDropdownOpen: open }),
  
  resetFilters: () => set({ filters: DEFAULT_FILTERS, formats: DEFAULT_FORMATS }),
}))

// Selectors for cleaner component code
export const selectSearchTerm = (state: SearchState) => state.searchTerm
export const selectFilters = (state: SearchState) => state.filters
export const selectFormats = (state: SearchState) => state.formats
export const selectIsDropdownOpen = (state: SearchState) => state.isDropdownOpen

