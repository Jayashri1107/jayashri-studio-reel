import React from 'react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-12 text-center">
                        {new Date().getFullYear()} &copy; Admin Dashboard. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
