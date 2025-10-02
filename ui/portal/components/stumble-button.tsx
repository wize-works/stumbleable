'use client';

import { cn } from '../lib/utils';

interface StumbleButtonProps {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

export function StumbleButton({ onClick, disabled = false, className }: StumbleButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'btn btn-primary btn-lg min-w-[200px] h-16 text-lg font-semibold',
                'hover:btn-primary-focus focus:btn-primary-focus',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200 transform hover:scale-105 active:scale-95',
                'shadow-lg hover:shadow-xl',
                className
            )}
        >
            <span className="flex items-center gap-2">
                Stumble
                <span className="text-sm opacity-75">(Space)</span>
            </span>
        </button>
    );
}