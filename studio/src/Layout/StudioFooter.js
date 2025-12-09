import React from 'react';

export default function StudioFooter() {
    return (
        <footer className="footer">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-sm-6">
                        <script>document.write(new Date().getFullYear())</script> © Ipshopy.
                    </div>
                    <div className="col-sm-6">
                        <div className="text-sm-end d-none d-sm-block">
                            Studio Platform v1.0
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}