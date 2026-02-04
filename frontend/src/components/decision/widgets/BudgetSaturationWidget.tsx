import React from 'react';
import ActionTable from '../ActionTable';
import { BudgetSaturationItem, exportBudgetOptimization, downloadBlob } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useData } from '@/context/DataContext';

interface Props {
    data: BudgetSaturationItem[];
}

export default function BudgetSaturationWidget({ data }: Props) {
    const { sessionId } = useData();

    const handleAction = async (items: BudgetSaturationItem[]) => {
        if (!sessionId) return;
        try {
            const payload = items.map(i => ({
                campaign_name: i.campaign_name,
                suggested_budget: i.suggested_budget
            }));

            const blob = await exportBudgetOptimization(sessionId, payload);
            downloadBlob(blob, 'budget_increases.xlsx');
        } catch (err) {
            console.error(err);
            alert("Failed to export.");
        }
    };

    const columns = [
        { header: 'Campaign', accessorKey: 'campaign_name' as keyof BudgetSaturationItem },
        { header: 'Daily Budget', accessorKey: 'daily_budget' as keyof BudgetSaturationItem, cell: (i: BudgetSaturationItem) => formatCurrency(i.daily_budget) },
        { header: 'Spend', accessorKey: 'spend' as keyof BudgetSaturationItem, cell: (i: BudgetSaturationItem) => formatCurrency(i.spend) },
        { header: 'ACOS', accessorKey: 'acos' as keyof BudgetSaturationItem, cell: (i: BudgetSaturationItem) => formatPercentage(i.acos) },
        { header: 'Suggested Budget', accessorKey: 'suggested_budget' as keyof BudgetSaturationItem, cell: (i: BudgetSaturationItem) => formatCurrency(i.suggested_budget) },
    ];

    return (
        <ActionTable
            data={data}
            columns={columns}
            title="Budget Saturation"
            description="Profitable campaigns that may be running out of budget."
            actionLabel="Increase Budgets"
            onAction={handleAction}
            accentColor="purple"
        />
    );
}
