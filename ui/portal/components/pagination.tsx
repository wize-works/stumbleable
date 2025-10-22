interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total: number;
    limit: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, total, limit }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5; // Number of page buttons to show

        if (totalPages <= showPages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            {/* Results info */}
            <div className="text-sm text-base-content/60">
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{total}</span> results
            </div>

            {/* Pagination buttons */}
            <div className="join">
                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <i className="fa-solid fa-duotone fa-chevron-left"></i>
                </button>

                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <button
                            key={`ellipsis-${index}`}
                            className="join-item btn btn-sm btn-disabled"
                        >
                            ...
                        </button>
                    ) : (
                        <button
                            key={page}
                            className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                            onClick={() => onPageChange(page as number)}
                        >
                            {page}
                        </button>
                    )
                ))}

                <button
                    className="join-item btn btn-sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <i className="fa-solid fa-duotone fa-chevron-right"></i>
                </button>
            </div>
        </div>
    );
}
