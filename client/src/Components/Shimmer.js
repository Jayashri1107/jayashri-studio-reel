import React from 'react';

export default function Shimmer({ rows = 5, cols = 3 }) {
    return (
        <div className="shimmer-container">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="shimmer-row">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <div key={colIndex} className="shimmer-cell"></div>
                    ))}
                </div>
            ))}
        </div>
    );
}

