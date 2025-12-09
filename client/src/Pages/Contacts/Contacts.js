import React, { useEffect } from 'react';

export default function Contacts() {
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title mb-4">Contacts</h4>
                        <p>Contacts page content goes here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

