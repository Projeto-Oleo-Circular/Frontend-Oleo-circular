import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (limit: number) => void
  itemsPerPageOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50],
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 py-2 text-sm text-white-500">
      <div>
        <span>
          Página <strong className="font-semibold text-white-500">{currentPage}</strong> de{' '}
          <strong className="font-semibold text-white-500">{totalPages}</strong>
        </span>
        {totalItems !== undefined && (
          <span className="ml-1 text-white-500">({totalItems} itens)</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-white-400 text-black-200 hover:bg-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, index) =>
          typeof p === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === p
                  ? 'bg-green-400 text-white shadow-xs'
                  : 'border border-white-200 bg-green-300 text-white-primary hover:bg-green-400/50 hover:text-green-primary'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={index} className="px-1 text-white-400 select-none">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-white-400 text-white-600 hover:bg-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {onItemsPerPageChange && itemsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white-500">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-white-200 rounded-lg px-2 py-1 text-xs text-white-600 bg-white focus:outline-none focus:border-green-primary cursor-pointer"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export default Pagination