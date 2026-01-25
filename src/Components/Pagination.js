import React, { useEffect } from 'react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    onPageChange,
    showInfo = true 
}) => {
    useEffect(() => {
        // Initialize Lucide icons after render
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [currentPage, totalPages]);

    if (totalPages <= 1 && !showInfo) {
        return null;
    }

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Handle first page click
    const handleFirst = () => {
        if (currentPage !== 1) {
            onPageChange(1);
        }
    };

    // Handle last page click
    const handleLast = () => {
        if (currentPage !== totalPages) {
            onPageChange(totalPages);
        }
    };

    const visiblePages = (() => {
        const maxVisiblePages = 3;
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisiblePages / 2);
        let start = currentPage - half;
        let end = start + maxVisiblePages - 1;

        if (start < 1) {
            start = 1;
            end = maxVisiblePages;
        }

        if (end > totalPages) {
            end = totalPages;
            start = totalPages - maxVisiblePages + 1;
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    })();

    return (
        <div className="d-flex justify-content-between align-items-center mt-3">
            {showInfo && (
                <div className="text-body">
                    Showing {startItem} to {endItem} of {totalItems} entries
                </div>
            )}
            <nav>
                <ul className="pagination mb-0">
                    {/* First button */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={handleFirst}
                            disabled={currentPage === 1}
                            aria-label="First"
                        >
                            <i data-lucide="chevrons-left" style={{width: '16px', height: '16px'}}></i>
                        </button>
                    </li>
                    
                    {/* Previous button */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            aria-label="Previous"
                        >
                            <i data-lucide="chevron-left" style={{width: '16px', height: '16px'}}></i>
                        </button>
                    </li>
                    
                    {/* Page numbers */}
                    {visiblePages.map((pageNum) => (
                        <li 
                            key={pageNum} 
                            className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                        >
                            <button 
                                className="page-link" 
                                onClick={() => onPageChange(pageNum)}
                            >
                                {pageNum}
                            </button>
                        </li>
                    ))}
                    
                    {/* Next button */}
                    <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={handleNext}
                            disabled={currentPage >= totalPages}
                            aria-label="Next"
                        >
                            <i data-lucide="chevron-right" style={{width: '16px', height: '16px'}}></i>
                        </button>
                    </li>
                    
                    {/* Last button */}
                    <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={handleLast}
                            disabled={currentPage >= totalPages}
                            aria-label="Last"
                        >
                            <i data-lucide="chevrons-right" style={{width: '16px', height: '16px'}}></i>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;