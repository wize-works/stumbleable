interface EmptyStateProps {
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    icon?: string;
    illustration?: 'bookmark' | 'lists' | 'search';
    className?: string;
}

// Simple SVG illustrations
const illustrations = {
    bookmark: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-base-content/20">
            <rect x="30" y="20" width="60" height="80" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M45 20v25l7.5-5 7.5 5V20" stroke="currentColor" strokeWidth="2" fill="currentColor" />
            <line x1="40" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="2" />
            <line x1="40" y1="65" x2="75" y2="65" stroke="currentColor" strokeWidth="2" />
            <line x1="40" y1="75" x2="70" y2="75" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
    lists: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-base-content/20">
            <rect x="20" y="20" width="80" height="15" rx="2" fill="currentColor" />
            <rect x="20" y="45" width="65" height="15" rx="2" fill="currentColor" />
            <rect x="20" y="70" width="70" height="15" rx="2" fill="currentColor" />
            <circle cx="105" cy="27.5" r="5" fill="currentColor" />
            <circle cx="100" cy="52.5" r="5" fill="currentColor" />
            <circle cx="102" cy="77.5" r="5" fill="currentColor" />
        </svg>
    ),
    search: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-base-content/20">
            <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="3" fill="none" />
            <line x1="71" y1="71" x2="85" y2="85" stroke="currentColor" strokeWidth="3" />
            <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    )
};

export function EmptyState({
    title,
    description,
    action,
    icon = 'fa-solid fa-duotone fa-search',
    illustration,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 px-4 ${className}`}>
            <div className="mb-6" role="img" aria-label="Empty state illustration">
                {illustration ? (
                    <div className="flex justify-center">
                        {illustrations[illustration]}
                    </div>
                ) : (
                    <div className="text-6xl">
                        {icon.startsWith('fa-') ? <i className={icon}></i> : icon}
                    </div>
                )}
            </div>

            <h3 className="text-xl font-semibold text-base-content mb-2">
                {title}
            </h3>

            <p className="text-base-content/60 mb-6 max-w-md mx-auto">
                {description}
            </p>

            {action && (
                action.href ? (
                    <a
                        href={action.href}
                        onClick={action.onClick}
                        className="btn btn-primary"
                    >
                        {action.label}
                    </a>
                ) : (
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="btn btn-primary"
                    >
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}