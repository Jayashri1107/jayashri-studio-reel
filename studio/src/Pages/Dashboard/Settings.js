import React from 'react';

export default function StudioSettings() {
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Settings</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <a href="/studio">Studio</a>
                                </li>
                                <li className="breadcrumb-item active">Settings</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">General Settings</h4>
                        </div>
                        <div className="card-body">
                            <p>Studio platform settings will be available here.</p>
                            <div className="alert alert-info">
                                <p className="mb-0">
                                    <i className="ri-information-line me-1"></i>
                                    Settings management is coming soon. For now, you can manage your profile information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}