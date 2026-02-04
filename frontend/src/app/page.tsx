'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { getDecisionCenterData } from '@/lib/api';
import FileUpload from '@/components/FileUpload';
import BulkFileUpload from '@/components/BulkFileUpload';
import KPICards from '@/components/KPICards';
import HealthScoreGauge from '@/components/decision/HealthScoreGauge';
import BleedingSpendWidget from '@/components/decision/widgets/BleedingSpendWidget';
import HighACOSWidget from '@/components/decision/widgets/HighACOSWidget';
import ScaleOpportunitiesWidget from '@/components/decision/widgets/ScaleOpportunitiesWidget';
import BudgetSaturationWidget from '@/components/decision/widgets/BudgetSaturationWidget';
import { SalesVsSpendChart, CampaignPerformanceChart, AcosDistributionChart } from '@/components/Charts';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { sessionId, setSessionId, kpis, campaigns, monthlyData, isLoading, decisionData, setDecisionData } = useData();




  // Local state for landing page workflow
  const [tempSessionId, setTempSessionId] = useState<string | null>(null);

  const handleStartAnalysis = () => {
    if (tempSessionId) {
      setSessionId(tempSessionId);
    }
  };

  // If we have a global session, show the dashboard
  if (!sessionId) {
    return (
      <div className="space-y-8 animate-fade-in pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PPC Decision Engine</h1>
            <p className="text-[var(--foreground-muted)] mt-1">
              Upload your data to generate actionable insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
          {/* Step 1: Search Term Report */}
          <div className={`card p-8 transition-all duration-300 ${tempSessionId ? 'border-[var(--success)] ring-1 ring-[var(--success)]' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                        ${tempSessionId ? 'bg-[var(--success)] text-white' : 'bg-[var(--primary-500)] text-white'}`}>
                {tempSessionId ? <Activity className="w-5 h-5" /> : '1'}
              </div>
              <div>
                <h2 className="text-xl font-semibold">Search Term Report</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Required to identify opportunities</p>
              </div>
            </div>

            <FileUpload
              autoNavigate={false}
              onSessionCreated={(id) => setTempSessionId(id)}
            />
          </div>

          {/* Step 2: Bulk File (Optional) */}
          <div className={`card p-8 transition-all duration-300 relative ${!tempSessionId ? 'opacity-50' : ''}`}>
            {/* Overlay to block interaction if step 1 not done */}
            {!tempSessionId && <div className="absolute inset-0 z-10 cursor-not-allowed" />}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Bulk File
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Optional</span>
                </h2>
                <p className="text-sm text-[var(--foreground-muted)]">Upload for Budget Saturation analysis</p>
              </div>
            </div>

            <div className="pointer-events-auto">
              <BulkFileUpload sessionId={tempSessionId} />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className={`fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t transition-transform duration-500 transform z-50
            ${tempSessionId ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Ready to analyze?</p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Your Search Term Report is uploaded and ready.
              </p>
            </div>
            <button
              onClick={handleStartAnalysis}
              className="btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
            >
              Start Analysis
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Overview of performance and prioritized actions
          </p>
        </div>
      </div>

      {/* Top Section: Health & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="card p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 absolute top-6 left-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Health Score
          </h3>
          <div className="mt-8">
            <HealthScoreGauge score={decisionData?.health_score?.score || 0} />
          </div>
          {decisionData?.health_score && (
            <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs w-full text-gray-500">
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300">{decisionData.health_score.spend_efficiency_score}</div>
                <div>Efficiency</div>
              </div>
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300">{decisionData.health_score.exact_match_score}</div>
                <div>Control</div>
              </div>
              <div>
                <div className="font-bold text-gray-700 dark:text-gray-300">{decisionData.health_score.acos_stability_score}</div>
                <div>ACOS</div>
              </div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="lg:col-span-2">
          <div className="h-full flex flex-col justify-center">
            <KPICards data={kpis} loading={isLoading} />
          </div>
        </div>
      </div>

      {/* Decision Widgets Grid */}
      <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
        <Activity className="w-6 h-6 text-indigo-500" />
        Action Items
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bleeding Spend */}
        <BleedingSpendWidget data={decisionData?.bleeding_spend || []} />

        {/* High ACOS */}
        <HighACOSWidget data={decisionData?.high_acos || []} />

        {/* Scale Opportunities */}
        <ScaleOpportunitiesWidget data={decisionData?.scale_opportunities || []} />

        {/* Budget Saturation + Upload */}
        <div className="space-y-6">
          <BudgetSaturationWidget data={decisionData?.budget_saturation || []} />
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Analysis Data</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Upload your Amazon Bulk Operations file to analyze budget utilization and saturation.
            </p>
            <BulkFileUpload />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2 pt-4">
        <BarChart3 className="w-6 h-6 text-indigo-500" />
        Performance Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--primary-500)]" />
            Monthly Sales vs Ad Spend
          </h3>
          <SalesVsSpendChart data={monthlyData} loading={isLoading} />
        </section>

        <section className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[var(--primary-500)]" />
            ACOS Distribution
          </h3>
          <AcosDistributionChart data={campaigns} loading={isLoading} />
        </section>
      </div>

      <section className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--primary-500)]" />
          Top Campaign Performance
        </h3>
        <CampaignPerformanceChart data={campaigns} loading={isLoading} />
      </section>

    </div>
  );
}
