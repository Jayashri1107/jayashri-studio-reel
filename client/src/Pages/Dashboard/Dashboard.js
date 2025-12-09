import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import ApiService from '../../Services/ApiService';

export default function Dashboard() {
    const [stats, setStats] = useState({
        pendingSeller: 12,
        pendingBrand: 8,
        approved: 45,
        rejected: 32,
        totalVideos: 312,
        totalSellers: 0,
        totalInfluencers: 0,
        sellerReels: {
            approved: 0,
            pending: 0,
            rejected: 0,
            total: 0
        },
        influencerReels: {
            approved: 0,
            pending: 0,
            rejected: 0,
            total: 0
        },
        brandReels: {
            approved: 0,
            pending: 0,
            rejected: 0,
            total: 0
        },
        totalApprovedReels: 0,
        totalPendingReels: 0,
        totalRejectedReels: 0,
        totalAllReels: 0,
        todayAllReels: 0,
        todayApprovedReels: 0,
        todayPendingReels: 0,
        todayRejectedReels: 0
    });

    useEffect(() => {
        fetchApprovedReelsCount();
    }, []);

    const fetchApprovedReelsCount = async () => {
        try {
            const response = await ApiService.getApprovedReelsCount();
            if (response.success) {
                setStats(prevStats => ({
                    ...prevStats,
                    sellerReels: response.data.sellerReels,
                    influencerReels: response.data.influencerReels,
                    brandReels: response.data.brandReels,
                    totalApprovedReels: response.data.totalApprovedReels,
                    totalPendingReels: response.data.totalPendingReels,
                    totalRejectedReels: response.data.totalRejectedReels,
                    totalAllReels: response.data.totalAllReels,
                    approved: response.data.totalApprovedReels, // Update the approved count to show total approved reels
                    totalVideos: response.data.totalAllReels, // Update total videos to show all reels
                    totalSellers: response.data.totalSellers || 0,
                    totalInfluencers: response.data.totalInfluencers || 0,
                    todayAllReels: response.data.todayAllReels || 0,
                    todayApprovedReels: response.data.todayApprovedReels || 0,
                    todayPendingReels: response.data.todayPendingReels || 0,
                    todayRejectedReels: response.data.todayRejectedReels || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching approved reels count:', error);
        }
    };

    // Chart refs
    const salesFunnelRef = useRef(null);
    const orderFunnelRef = useRef(null);
    const cancelFunnelRef = useRef(null);
    const customerFunnelRef = useRef(null);
    const bubbleChartRef = useRef(null);
    const orderChartRef = useRef(null);
    const heatmapChartRef = useRef(null);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Generate random data for charts
    const generateData = (count, min, max) => {
        return Array.from({ length: count }, () => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );
    };

    const generateBubbleData = (count, min, max) => {
        return Array.from({ length: count }, () => {
            const x = Math.floor(Math.random() * 200) + 500;
            const y = Math.floor(Math.random() * (max - min + 1)) + min;
            const z = Math.floor(Math.random() * 50) + 15;
            return [x, y, z];
        });
    };

    // Chart options
    const salesFunnelOptions = {
        chart: {
            type: 'area',
            height: 50,
            sparkline: { enabled: true }
        },
        series: [{ data: [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54] }],
        stroke: { width: 0, curve: 'smooth' },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                opacityFrom: 0.9,
                opacityTo: 0.3,
                stops: [0, 100]
            }
        },
        markers: { size: 0 },
        colors: ['#4d5761'],
        tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { title: { formatter: () => '' } },
            marker: { show: false }
        }
    };

    const orderFunnelOptions = {
        chart: {
            type: 'bar',
            height: 50,
            sparkline: { enabled: true }
        },
        series: [{ data: [17, 83, 56, 45, 29, 92, 38, 72, 11, 67, 53, 29, 92, 18, 16, 11] }],
        stroke: { width: 0, curve: 'smooth' },
        plotOptions: {
            bar: {
                borderRadius: 3,
                columnWidth: '30%'
            }
        },
        markers: { size: 0 },
        colors: ['#22b956'],
        tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { title: { formatter: () => '' } },
            marker: { show: false }
        }
    };

    const cancelFunnelOptions = {
        chart: {
            type: 'bar',
            height: 50,
            sparkline: { enabled: true }
        },
        series: [{ data: [92, 18, 16, 11, 8, 5, 25, 83, 56, 45, 72, 11, 67, 53, 29, 92] }],
        stroke: { width: 0, curve: 'smooth' },
        plotOptions: {
            bar: {
                borderRadius: 3,
                columnWidth: '30%'
            }
        },
        markers: { size: 0 },
        colors: ['#22b956'],
        tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { title: { formatter: () => '' } },
            marker: { show: false }
        }
    };

    const customerFunnelOptions = {
        chart: {
            type: 'area',
            height: 50,
            sparkline: { enabled: true }
        },
        series: [{ data: [45, 12, 78, 31, 56, 89, 22, 67, 41, 53, 96] }],
        stroke: { width: 0, curve: 'smooth' },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                opacityFrom: 0.9,
                opacityTo: 0.3,
                stops: [0, 100]
            }
        },
        markers: { size: 0 },
        colors: ['#4d5761'],
        tooltip: {
            fixed: { enabled: false },
            x: { show: false },
            y: { title: { formatter: () => '' } },
            marker: { show: false }
        }
    };

    return (
        <>
            {/* Top Row - KPI Cards with Mini Charts */}
            <div className="row">
                <div className="col-xl-3 col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Today Videos</p>
                                    <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">{stats.todayAllReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="calendar" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={orderFunnelOptions}
                                            series={orderFunnelOptions.series}
                                            type="bar"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Today Approved</p>
                                    <h4 className="fw-bold text-success d-flex align-items-center gap-2 mb-0">{stats.todayApprovedReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="check-circle" className="fs-32 text-success"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={salesFunnelOptions}
                                            series={salesFunnelOptions.series}
                                            type="area"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Today Pending</p>
                                    <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">{stats.todayPendingReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="clock" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={orderFunnelOptions}
                                            series={orderFunnelOptions.series}
                                            type="bar"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Today Rejected</p>
                                    <h4 className="fw-bold text-primary d-flex align-items-center gap-2 mb-0">{stats.todayRejectedReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="shield-minus" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={cancelFunnelOptions}
                                            series={cancelFunnelOptions.series}
                                            type="bar"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-xl-3 col-md-6">
                    <Link to="/influencers" className="text-decoration-none">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="mb-3 card-title">Total Influencers</p>
                                        <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">{stats.totalInfluencers.toLocaleString()}</h4>
                                    </div>
                                    <div>
                                        <i data-lucide="user" className="fs-32 text-primary"></i>
                                    </div>
                                </div>
                                <div className="row align-items-center mt-4">
                                    <div className="col-12">
                                        <div id="influencer_funnel" className="apex-charts">
                                            <Chart
                                                options={customerFunnelOptions}
                                                series={customerFunnelOptions.series}
                                                type="area"
                                                height={50}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
                
                <div className="col-xl-3 col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Approved Videos</p>
                                    <h4 className="fw-bold text-success d-flex align-items-center gap-2 mb-0">
                                        {stats.approved.toLocaleString()}
                                    </h4>
                                    <p className="text-muted small mb-0">
                                        Seller: {stats.sellerReels.approved} | Influencer: {stats.influencerReels.approved} | Brand: {stats.brandReels.approved}
                                    </p>
                                </div>
                                <div>
                                    <i data-lucide="check-circle" className="fs-32 text-success"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={salesFunnelOptions}
                                            series={salesFunnelOptions.series}
                                            type="area"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Total Videos</p>
                                    <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">{stats.totalVideos.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="video" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={orderFunnelOptions}
                                            series={orderFunnelOptions.series}
                                            type="bar"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-3 card-title">Rejected Videos</p>
                                    <h4 className="fw-bold text-primary d-flex align-items-center gap-2 mb-0">{stats.totalRejectedReels}</h4>
                                </div>
                                <div>
                                    <i data-lucide="shield-minus" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-4">
                                <div className="col-12">
                                    <div className="apex-charts">
                                        <Chart
                                            options={cancelFunnelOptions}
                                            series={cancelFunnelOptions.series}
                                            type="bar"
                                            height={50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6">
                    <Link to="/sellers" className="text-decoration-none">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="mb-3 card-title">Total Sellers</p>
                                        <h4 className="fw-bold d-flex align-items-center gap-2 mb-0">{stats.totalSellers.toLocaleString()}</h4>
                                    </div>
                                    <div>
                                        <i data-lucide="users" className="fs-32 text-primary"></i>
                                    </div>
                                </div>
                                <div className="row align-items-center mt-4">
                                    <div className="col-12">
                                        <div className="apex-charts">
                                            <Chart
                                                options={customerFunnelOptions}
                                                series={customerFunnelOptions.series}
                                                type="area"
                                                height={50}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

            </div>

            {/* Recent Video Approvals */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="card-title mb-0">Recent Video Approvals</h4>
                            </div>
                            <div className="dropdown">
                                <a href="#" className="dropdown-toggle btn btn-sm btn-link text-uppercase fw-semibold px-0" data-bs-toggle="dropdown" aria-expanded="false">
                                    Daily
                                </a>
                                <div className="dropdown-menu dropdown-menu-end">
                                    <a href="#!" className="dropdown-item">Daily</a>
                                    <a href="#!" className="dropdown-item">Weekly</a>
                                    <a href="#!" className="dropdown-item">Monthly</a>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Video Type</th>
                                            <th>Status</th>
                                            <th>Views</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>2025-01-29</td>
                                            <td>Seller Video</td>
                                            <td><span className="badge badge-soft-success">Approved</span></td>
                                            <td>1,234</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-28</td>
                                            <td>Brand Video</td>
                                            <td><span className="badge badge-soft-danger">Rejected</span></td>
                                            <td>0</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-27</td>
                                            <td>Seller Video</td>
                                            <td><span className="badge badge-soft-warning">Pending</span></td>
                                            <td>-</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-26</td>
                                            <td>Brand Video</td>
                                            <td><span className="badge badge-soft-success">Approved</span></td>
                                            <td>890</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-25</td>
                                            <td>Seller Video</td>
                                            <td><span className="badge badge-soft-danger">Rejected</span></td>
                                            <td>0</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-24</td>
                                            <td>Brand Video</td>
                                            <td><span className="badge badge-soft-success">Approved</span></td>
                                            <td>2,450</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-23</td>
                                            <td>Seller Video</td>
                                            <td><span className="badge badge-soft-warning">Pending</span></td>
                                            <td>-</td>
                                        </tr>
                                        <tr>
                                            <td>2025-01-22</td>
                                            <td>Brand Video</td>
                                            <td><span className="badge badge-soft-success">Approved</span></td>
                                            <td>1,750</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card-footer border-top text-center p-3">
                            <Link to="/videos" className="link-primary text-decoration-underline fw-medium">
                                Show More <i className="ri-arrow-right-up-line"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
