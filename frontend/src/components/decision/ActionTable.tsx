import React, { useState } from 'react';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

interface ActionTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
    actionLabel: string;
    onAction: (items: T[]) => void;
    accentColor?: 'red' | 'orange' | 'green' | 'purple';
    description?: string;
}

export default function ActionTable<T>({
    data,
    columns,
    title,
    actionLabel,
    onAction,
    accentColor = 'green',
    description
}: ActionTableProps<T>) {
    const [selected, setSelected] = useState<T[]>([]);

    // Selection handling
    const toggleSelectAll = () => {
        if (selected.length === data.length) setSelected([]);
        else setSelected([...data]);
    };

    const toggleSelect = (item: T) => {
        if (selected.includes(item)) {
            setSelected(selected.filter(i => i !== item));
        } else {
            setSelected([...selected, item]);
        }
    };

    const getAccentClass = () => {
        switch (accentColor) {
            case 'red': return 'border-l-4 border-l-red-500';
            case 'orange': return 'border-l-4 border-l-orange-500';
            case 'green': return 'border-l-4 border-l-green-500';
            case 'purple': return 'border-l-4 border-l-purple-500';
            default: return 'border-l-4 border-l-gray-500';
        }
    };

    const getButtonClass = () => {
        switch (accentColor) {
            case 'red': return 'bg-red-500 hover:bg-red-600 text-white';
            case 'orange': return 'bg-orange-500 hover:bg-orange-600 text-white';
            case 'green': return 'bg-green-500 hover:bg-green-600 text-white';
            case 'purple': return 'bg-purple-500 hover:bg-purple-600 text-white';
            default: return 'bg-gray-500 hover:bg-gray-600 text-white';
        }
    };

    if (data.length === 0) {
        return (
            <div className={`card p-6 ${getAccentClass()}`}>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                {description && <p className="text-sm text-[var(--foreground-muted)] mb-4">{description}</p>}
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                    No items found. Great job!
                </div>
            </div>
        );
    }

    return (
        <div className={`card overflow-hidden ${getAccentClass()}`}>
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card-background)]">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        {title}
                        <span className="text-xs font-normal text-[var(--foreground-muted)] px-2 py-0.5 bg-[var(--background)] rounded-full border border-[var(--border)]">
                            {data.length}
                        </span>
                    </h3>
                    {description && <p className="text-sm text-[var(--foreground-muted)] mt-1">{description}</p>}
                </div>
                <button
                    onClick={() => onAction(selected)}
                    disabled={selected.length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonClass()}`}
                >
                    {actionLabel} ({selected.length})
                </button>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--foreground-muted)] uppercase bg-[var(--background-secondary)] sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="p-4 w-4 border-b border-[var(--border)]">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === data.length && data.length > 0}
                                        onChange={toggleSelectAll}
                                        className="checkbox"
                                    />
                                </div>
                            </th>
                            {columns.map((col, idx) => (
                                <th key={idx} scope="col" className={`px-6 py-3 border-b border-[var(--border)] text-${col.align || 'left'}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {data.map((item, idx) => (
                            <tr
                                key={idx}
                                className="bg-[var(--card-background)] hover:bg-[var(--background)] transition-colors"
                                onClick={() => toggleSelect(item)}
                            >
                                <td className="w-4 p-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(item)}
                                            onChange={() => toggleSelect(item)}
                                            className="checkbox"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </td>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-6 py-4 text-${col.align || 'left'}`}>
                                        {col.cell ? col.cell(item) : (item as any)[col.accessorKey as string]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
