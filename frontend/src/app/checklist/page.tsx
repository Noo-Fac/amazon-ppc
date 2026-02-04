'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { getDecisionCenterData, DecisionCenterResponse } from '@/lib/api';
import BleedingSpendWidget from '@/components/decision/widgets/BleedingSpendWidget';
import HighACOSWidget from '@/components/decision/widgets/HighACOSWidget';
import ScaleOpportunitiesWidget from '@/components/decision/widgets/ScaleOpportunitiesWidget';
import BudgetSaturationWidget from '@/components/decision/widgets/BudgetSaturationWidget';

export default function ChecklistPage() {
    const { sessionId, decisionData, setDecisionData } = useData();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionId && !decisionData && !loading) {
            setLoading(true);
            getDecisionCenterData(sessionId)
                .then(data => {
                    setDecisionData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [sessionId, decisionData, loading, setDecisionData]);

    if (!sessionId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">No Data Session</h2>
                    <p className="text-gray-500">Please upload a report on the Dashboard first.</p>
                </div>
            </div>
        );
    }

    if (loading || !decisionData) {
        return <div className="p-8 text-center">Analzying Data...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily PPC Checklist</h1>
                    <p className="text-gray-500 dark:text-gray-400">Review and execute your daily optimizations</p>
                </div>
            </div>

            {/* 1. Urgent Fixes */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 border-b pb-2">🔴 Must Fix Today</h2>
                <BleedingSpendWidget data={decisionData.bleeding_spend} />
            </section>

            {/* 2. Should Optimize */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400 border-b pb-2">🟠 Should Optimize</h2>
                <HighACOSWidget data={decisionData.high_acos} />
            </section>

            {/* 3. Growth Opportunities */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 border-b pb-2">🟢 Growth Opportunities</h2>
                <div className="grid grid-cols-1 gap-6">
                    <ScaleOpportunitiesWidget data={decisionData.scale_opportunities} />
                </div>
            </section>

            {/* 4. Budget Checks */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400 border-b pb-2">🟣 Budget Checks</h2>
                <BudgetSaturationWidget data={decisionData.budget_saturation} />
            </section>
        </div>
    );
}
