import React from 'react';
import ActionTable from '../ActionTable';
import { BleedingSpendItem, exportNegatives, downloadBlob } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useData } from '@/context/DataContext';

interface Props {
    data: BleedingSpendItem[];
}

export default function BleedingSpendWidget({ data }: Props) {
    const { sessionId } = useData();

    const handleAction = async (items: BleedingSpendItem[]) => {
        if (!sessionId) return;
        try {
            // Filter out items without IDs (shouldn't happen with updated backend)
            const ids = items.map(i => i.id).filter(id => id !== undefined && id !== null);

            if (ids.length === 0) {
                alert("No valid items selected.");
                return;
            }

            // Export logic - passing full items to ensure IDs are preserved
            const blob = await exportNegatives(sessionId, ids, false, items);
            downloadBlob(blob, 'bleeding_spend_negatives.xlsx');

        } catch (err) {
            console.error(err);
            alert("Failed to export negatives.");
        }
    };

    const columns = [
        { header: 'Search Term', accessorKey: 'search_term' as keyof BleedingSpendItem },
        { header: 'Spend', accessorKey: 'spend' as keyof BleedingSpendItem, cell: (i: BleedingSpendItem) => formatCurrency(i.spend) },
        { header: 'Clicks', accessorKey: 'clicks' as keyof BleedingSpendItem, cell: (i: BleedingSpendItem) => formatNumber(i.clicks) },
        { header: 'Campaign', accessorKey: 'campaign_name' as keyof BleedingSpendItem },
        { header: 'Match Type', accessorKey: 'match_type' as keyof BleedingSpendItem },
        { header: 'Camp. ID', accessorKey: 'campaign_id' as keyof BleedingSpendItem, cell: (i: BleedingSpendItem) => i.campaign_id || '-' },
        { header: 'AG ID', accessorKey: 'ad_group_id' as keyof BleedingSpendItem, cell: (i: BleedingSpendItem) => i.ad_group_id || '-' },
    ];

    return (
        <ActionTable
            data={data}
            columns={columns}
            title="Bleeding Spend (Zero Sales)"
            description="Terms spending money without generating any sales. Negate them."
            actionLabel="Generate Negatives"
            onAction={handleAction}
            accentColor="red"
        />
    );
}
