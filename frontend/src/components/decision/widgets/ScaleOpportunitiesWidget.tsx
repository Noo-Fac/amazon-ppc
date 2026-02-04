import React from 'react';
import ActionTable from '../ActionTable';
import { ScaleOpportunityItem, exportBidOptimization, downloadBlob } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useData } from '@/context/DataContext';

interface Props {
    data: ScaleOpportunityItem[];
}

export default function ScaleOpportunitiesWidget({ data }: Props) {
    const { sessionId } = useData();

    const handleAction = async (items: ScaleOpportunityItem[]) => {
        if (!sessionId) return;
        try {
            // Construct payload for BidChangeRequest
            const payload = items.map(i => ({
                campaign_name: i.campaign_name,
                targeting: i.targeting,
                match_type: i.match_type,
                current_bid: i.current_bid,
                suggested_bid: i.suggested_bid,
                // Pass IDs for bulk file mapping
                campaign_id: i.campaign_id,
                ad_group_id: i.ad_group_id
            }));

            const blob = await exportBidOptimization(sessionId, payload);
            downloadBlob(blob, 'scale_opportunities_bids.xlsx');
        } catch (err) {
            console.error(err);
            alert("Failed to export.");
        }
    };

    const columns = [
        { header: 'Search Term', accessorKey: 'search_term' as keyof ScaleOpportunityItem },
        { header: 'Orders', accessorKey: 'orders' as keyof ScaleOpportunityItem },
        { header: 'ACOS', accessorKey: 'acos' as keyof ScaleOpportunityItem, cell: (i: ScaleOpportunityItem) => formatPercentage(i.acos) },
        { header: 'Current CPC', accessorKey: 'current_bid' as keyof ScaleOpportunityItem, cell: (i: ScaleOpportunityItem) => formatCurrency(i.current_bid) },
        { header: 'Suggested Bid', accessorKey: 'suggested_bid' as keyof ScaleOpportunityItem, cell: (i: ScaleOpportunityItem) => formatCurrency(i.suggested_bid) },
    ];

    return (
        <ActionTable
            data={data}
            columns={columns}
            title="Scale Opportunities"
            description="Profitable terms ready for bid increase."
            actionLabel="Increase Bids"
            onAction={handleAction}
            accentColor="green"
        />
    );
}
