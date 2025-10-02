interface DiscoveryDetailsBarProps {
    hasError: boolean;
    onOpenModal: () => void;
}

export function DiscoveryDetailsBar({ hasError, onOpenModal }: DiscoveryDetailsBarProps) {
    return (
        <div className="fixed bottom-26 left-1/2 transform -translate-x-1/2 z-40">
            <button
                onClick={onOpenModal}
                className={` btn ${hasError
                    ? 'animate-pulse text-warning font-bold'
                    : 'text-base-content/60'
                    }`}
            >
                <i className={`fa-solid fa-duotone fa-info-circle ${hasError ? 'text-warning' : 'text-base-content/60'
                    }`}></i>
                <span>Discovery Details</span>
                {hasError && (
                    <span className="badge badge-warning badge-sm animate-pulse">Issue Detected</span>
                )}
            </button>
        </div>
    );
}
