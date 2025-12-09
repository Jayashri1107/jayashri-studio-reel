import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function DataSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        
        try {
            const response = await fetch('http://localhost:3188/DataSync/sync');
            const data = await response.json();
            
            if (data.success) {
                toast.success('Data synchronization completed successfully!');
                setSyncResult(data);
            } else {
                toast.error('Data synchronization failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error during sync:', error);
            toast.error('Error during data synchronization: ' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">Data Synchronization</h4>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info">
                            <h5>Data Sync Information</h5>
                            <p>This feature synchronizes data from the Sagar database to the Ipshopy Reels database:</p>
                            <ul>
                                <li>Fetches sellers from <code>oc_vendor</code> table in Sagar database</li>
                                <li>Fetches brands from <code>oc_manufacturer</code> table in Sagar database</li>
                                <li>Stores/updates this data in the Ipshopy Reels database</li>
                            </ul>
                        </div>
                        
                        <div className="d-grid gap-2">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Synchronizing...
                                    </>
                                ) : (
                                    'Sync Data from Sagar to Ipshopy Reels'
                                )}
                            </button>
                        </div>
                        
                        {syncResult && (
                            <div className="mt-4">
                                <h5>Sync Results</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h6 className="card-title">Sellers</h6>
                                                <p className="card-text display-6">{syncResult.sellers}</p>
                                                <p className="text-muted">records synchronized</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h6 className="card-title">Brands</h6>
                                                <p className="card-text display-6">{syncResult.brands}</p>
                                                <p className="text-muted">records synchronized</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}