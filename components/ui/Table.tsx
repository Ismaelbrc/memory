'use client';

import { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'Nenhum registro encontrado',
  loading = false,
}: TableProps<T>) {
  return (
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
                  ${col.sortable && onSort ? 'cursor-pointer select-none hover:text-slate-200 transition-colors' : ''}
                  ${col.className || ''}
                `}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && onSort && (
                    <span className="text-slate-600">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="w-3 h-3 text-amber-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-amber-400" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
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
  );
}
