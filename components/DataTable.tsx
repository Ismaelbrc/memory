'use client';

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyMessage?: string;
  actions?: ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pagination,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = String(a[sortKey] || '');
    const bVal = String(b[sortKey] || '');
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(onSearchChange || actions) && (
        <div className="flex items-center gap-3 flex-wrap">
          {onSearchChange && (
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#1a1f2e] border border-[#2a2f42] text-slate-100 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 placeholder:text-slate-600"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#2a2f42]">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400
                    bg-[#1a1f2e] border-b border-[#2a2f42]
                    ${col.sortable ? 'cursor-pointer select-none hover:text-slate-200 transition-colors' : ''}
                    ${col.className || ''}
                  `}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr key={i} className="border-b border-[#2a2f42]/50 hover:bg-[#2a2f42]/20 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-slate-200 ${col.className || ''}`}>
                      {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
              let page: number;
              if (pagination.pages <= 7) {
                page = i + 1;
              } else if (pagination.page <= 4) {
                page = i + 1;
              } else if (pagination.page >= pagination.pages - 3) {
                page = pagination.pages - 6 + i;
              } else {
                page = pagination.page - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange && onPageChange(page)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${pagination.page === page
                      ? 'bg-amber-500 text-black'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42]'
                    }
                  `}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
