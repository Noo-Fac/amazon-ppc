'use client';

import Link from 'next/link';
import { Rocket, Target, ArrowRight } from 'lucide-react';

export default function CampaignsHubPage() {
    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold">Campaign Generator</h1>
                <p className="text-[var(--foreground-muted)] text-lg max-w-2xl mx-auto">
                    Create Amazon Sponsored Products campaigns in bulk. Choose a campaign type to get started.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Auto Campaign Card */}
                <Link
                    href="/campaigns/auto"
                    className="group card p-8 hover:border-[var(--primary-500)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary-500)]/10"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--primary-500)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Rocket className="w-8 h-8 text-[var(--primary-500)]" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3 group-hover:text-[var(--primary-500)] transition-colors">
                        Auto Campaign
                    </h2>

                    <p className="text-[var(--foreground-muted)] mb-8 leading-relaxed">
                        Let Amazon's algorithm find keywords for you. Generate campaigns with Close Match, Loose Match, Substitutes, and Complements targeting.
                    </p>

                    <div className="flex items-center gap-2 font-semibold text-[var(--primary-500)]">
                        Launch Generator
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Manual Campaign Card */}
                <Link
                    href="/campaigns/manual"
                    className="group card p-8 hover:border-[var(--secondary-500)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--secondary-500)]/10"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--secondary-500)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Target className="w-8 h-8 text-[var(--secondary-500)]" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3 group-hover:text-[var(--secondary-500)] transition-colors">
                        Manual Campaign
                    </h2>

                    <p className="text-[var(--foreground-muted)] mb-8 leading-relaxed">
                        Target specific Keywords (Exact, Phrase, Broad) or Products (ASINs). Ideal for scaling proven winners and precise targeting.
                    </p>

                    <div className="flex items-center gap-2 font-semibold text-[var(--secondary-500)]">
                        Launch Generator
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Helper Info */}
            <div className="mt-12 p-6 rounded-2xl bg-[var(--background-muted)]/50 border border-[var(--border)] text-center">
                <h3 className="font-semibold mb-2">Not sure which to choose?</h3>
                <p className="text-[var(--foreground-muted)] text-sm">
                    Start with an <strong>Auto Campaign</strong> to discover performing search terms.
                    Then, move those successful terms into a <strong>Manual Campaign</strong> for better control and bid optimization.
                </p>
            </div>
        </div>
    );
}
