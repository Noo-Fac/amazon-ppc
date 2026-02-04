import React from 'react';
import ActionTable from '../ActionTable';
import { HighACOSItem, exportBidOptimization, exportNegatives, downloadBlob } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useData } from '@/context/DataContext';

interface Props {
    data: HighACOSItem[];
}

export default function HighACOSWidget({ data }: Props) {
    const { sessionId } = useData();

    const handleAction = async (items: HighACOSItem[]) => {
        if (!sessionId) return;
        try {
            // Split items into Bid Down and Negative actions
            const bidItems = items.filter(i => i.action_type === 'Bid Down');
            const negativeItems = items.filter(i => i.action_type === 'Negative');

            if (bidItems.length > 0) {
                // Construct payload for BidChangeRequest
                const payload = bidItems.map(i => ({
                    campaign_name: i.campaign_name,
                    targeting: i.targeting,
                    match_type: i.match_type,
                    // Suggest decreasing CPC, e.g. -20%
                    suggested_bid: i.value * 0.8,
                    // Pass IDs for bulk file generator
                    campaign_id: i.campaign_id,
                    ad_group_id: i.ad_group_id
                }));

                const blob = await exportBidOptimization(sessionId, payload);
                downloadBlob(blob, 'high_acos_bid_down.xlsx');
            }

            if (negativeItems.length > 0) {
                const ids = negativeItems.map(i => i.id).filter(id => id !== undefined && id !== null) as number[];
                const blob = await exportNegatives(sessionId, ids, false, negativeItems);
                downloadBlob(blob, 'high_acos_negatives.xlsx');
            }

            if (bidItems.length === 0 && negativeItems.length === 0) {
                alert("Selected items require manual review (e.g. Listing improvements).");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to export.");
        }
    };

    const columns = [
        { header: 'Search Term', accessorKey: 'search_term' as keyof HighACOSItem },
        { header: 'ACOS', accessorKey: 'acos' as keyof HighACOSItem, cell: (i: HighACOSItem) => formatPercentage(i.acos) },
        { header: 'Spend', accessorKey: 'spend' as keyof HighACOSItem, cell: (i: HighACOSItem) => formatCurrency(i.spend) },
        { header: 'Root Cause', accessorKey: 'root_cause' as keyof HighACOSItem },
        { header: 'Action', accessorKey: 'action_type' as keyof HighACOSItem },
    ];

    return (
        <ActionTable
            data={data}
            columns={columns}
            title="High ACOS Analysis"
            description="Terms exceeding target ACOS. 'Bid Down' items can be bulk optimized."
            actionLabel="Download Bid Updates"
            onAction={handleAction}
            accentColor="orange"
        />
    );
}
