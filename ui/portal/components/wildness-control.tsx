'use client';

import { cn } from '../lib/utils';

interface WildnessControlProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

export function WildnessControl({ value, onChange, className = '' }: WildnessControlProps) {
    return (
        <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
            <label className="text-xs sm:text-sm font-medium text-base-content min-w-0 whitespace-nowrap">
                Wildness
            </label>
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-[120px] sm:min-w-[140px]">
                <span className="text-xs text-base-content/60 hidden sm:inline">Safe</span>
                <span className="text-xs text-base-content/60 sm:hidden">S</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="range range-primary range-xs sm:range-sm flex-1 touch-manipulation"
                    style={{
                        minHeight: '24px', // Better touch target on mobile
                    }}
                    aria-label="Wildness level"
                />
                <span className="text-xs text-base-content/60 hidden sm:inline">Wild</span>
                <span className="text-xs text-base-content/60 sm:hidden">W</span>
            </div>
            <div className="min-w-[2rem] sm:min-w-[2.5rem] text-right">
                <span className="text-xs sm:text-sm font-mono text-base-content">
                    {value}
                </span>
            </div>
        </div>
    );
}