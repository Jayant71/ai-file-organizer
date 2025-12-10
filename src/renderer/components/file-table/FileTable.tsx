/**
 * File Table Component
 * Displays scanned files in a filterable, sortable table.
 */

import React, { useState, useMemo } from 'react';
import { FileMeta, getFileCategory } from '@/domain/types/file';
import { formatFileSize, formatDate } from '@/services/config';

interface FileTableProps {
    files: FileMeta[];
}

type SortField = 'name' | 'size' | 'modifiedTime' | 'extension';
type SortDirection = 'asc' | 'desc';

const categoryIcons: Record<string, string> = {
    documents: '📄',
    images: '🖼️',
    videos: '🎬',
    audio: '🎵',
    archives: '📦',
    code: '💻',
    other: '📁',
};

export default function FileTable({ files }: FileTableProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Filter and sort files
    const filteredFiles = useMemo(() => {
        let result = [...files];

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                (f) =>
                    f.name.toLowerCase().includes(searchLower) ||
                    f.path.toLowerCase().includes(searchLower)
            );
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(
                (f) => getFileCategory(f.extension) === categoryFilter
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'modifiedTime':
                    comparison =
                        new Date(a.modifiedTime).getTime() -
                        new Date(b.modifiedTime).getTime();
                    break;
                case 'extension':
                    comparison = a.extension.localeCompare(b.extension);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [files, search, categoryFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredFiles.length / pageSize);
    const paginatedFiles = filteredFiles.slice(
        page * pageSize,
        (page + 1) * pageSize
    );

    // Categories for filter
    const categories = useMemo(() => {
        const counts: Record<string, number> = {};
        files.forEach((f) => {
            const cat = getFileCategory(f.extension);
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [files]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-slate-300">↕</span>;
        return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="card">
            {/* Filters */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="input"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1 flex-wrap">
                        <button
                            onClick={() => {
                                setCategoryFilter('all');
                                setPage(0);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${categoryFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            All ({files.length})
                        </button>
                        {categories.map(([cat, count]) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategoryFilter(cat);
                                    setPage(0);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${categoryFilter === cat
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {categoryIcons[cat]} {cat} ({count})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-container max-h-[500px]">
                <table>
                    <thead>
                        <tr>
                            <th
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Name <SortIcon field="name" />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort('extension')}
                            >
                                <div className="flex items-center gap-1">
                                    Type <SortIcon field="extension" />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort('size')}
                            >
                                <div className="flex items-center gap-1">
                                    Size <SortIcon field="size" />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort('modifiedTime')}
                            >
                                <div className="flex items-center gap-1">
                                    Modified <SortIcon field="modifiedTime" />
                                </div>
                            </th>
                            <th>Path</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedFiles.map((file) => (
                            <tr key={file.id}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span>{categoryIcons[getFileCategory(file.extension)]}</span>
                                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                                            {file.name}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-primary">
                                        {file.extension || 'No ext'}
                                    </span>
                                </td>
                                <td className="text-slate-600 dark:text-slate-400">
                                    {formatFileSize(file.size)}
                                </td>
                                <td className="text-slate-600 dark:text-slate-400">
                                    {formatDate(file.modifiedTime)}
                                </td>
                                <td className="text-slate-500 dark:text-slate-500 font-mono text-xs truncate max-w-[250px]">
                                    {file.parentPath}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Showing {page * pageSize + 1} -{' '}
                        {Math.min((page + 1) * pageSize, filteredFiles.length)} of{' '}
                        {filteredFiles.length} files
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
