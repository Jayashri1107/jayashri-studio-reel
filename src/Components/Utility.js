// Utility functions
export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
};

