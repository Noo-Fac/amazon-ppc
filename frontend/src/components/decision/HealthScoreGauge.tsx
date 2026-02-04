import React from 'react';

interface HealthScoreGaugeProps {
    score: number;
    size?: number;
    label?: string;
}

export default function HealthScoreGauge({ score, size = 120, label = "Health Score" }: HealthScoreGaugeProps) {
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Color based on score
    let color = "text-red-500";
    if (score >= 70) color = "text-green-500";
    else if (score >= 50) color = "text-yellow-500";
    else if (score >= 30) color = "text-orange-500";

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-gray-200 dark:text-gray-700"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
                    <circle
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${color}`}>{score}</span>
                    <span className="text-xs text-gray-500 uppercase">Score</span>
                </div>
            </div>
            {label && <div className="mt-2 font-medium text-gray-600 dark:text-gray-300">{label}</div>}
        </div>
    );
}
