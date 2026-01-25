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

    const [recentReels, setRecentReels] = useState([]);

    useEffect(() => {
        fetchApprovedReelsCount();
        fetchRecentReels();
    }, []);

    const fetchApprovedReelsCount = async () => {
        try {
            const response = await ApiService.getApprovedReelsCount();
            if (response.success) {
                const defaultCount = { approved: 0, pending: 0, rejected: 0, total: 0 };
                setStats(prevStats => ({
                    ...prevStats,
                    sellerReels: response.data.seller_reels || response.data.sellerReels || defaultCount,
                    influencerReels: response.data.influencer_reels || response.data.influencerReels || defaultCount,
                    brandReels: response.data.brand_reels || response.data.brandReels || defaultCount,
                    totalApprovedReels: response.data.total_approved_reels || response.data.totalApprovedReels || 0,
                    totalPendingReels: response.data.total_pending_reels || response.data.totalPendingReels || 0,
                    totalRejectedReels: response.data.total_rejected_reels || response.data.totalRejectedReels || 0,
                    totalAllReels: response.data.total_all_reels || response.data.totalAllReels || 0,
                    approved: response.data.total_approved_reels || response.data.totalApprovedReels || 0,
                    totalVideos: response.data.total_all_reels || response.data.totalAllReels || 0,
                    totalSellers: response.data.total_sellers || response.data.totalSellers || 0,
                    totalInfluencers: response.data.total_influencers || response.data.totalInfluencers || 0,
                    todayAllReels: response.data.today_all_reels || response.data.todayAllReels || 0,
                    todayApprovedReels: response.data.today_approved_reels || response.data.todayApprovedReels || 0,
                    todayPendingReels: response.data.today_pending_reels || response.data.todayPendingReels || 0,
                    todayRejectedReels: response.data.today_rejected_reels || response.data.todayRejectedReels || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching approved reels count:', error);
        }
    };

    const fetchRecentReels = async () => {
        try {
            const resp = await ApiService.getRecentApprovedReels(8);
            if (resp?.success) {
                setRecentReels(Array.isArray(resp.data) ? resp.data : []);
            } else {
                setRecentReels([]);
            }
        } catch (error) {
            console.error('Error fetching recent reels:', error);
            setRecentReels([]);
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
            sparkline: { enabled: true },
            toolbar: { show: false },
            zoom: { enabled: false }
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
            enabled: false
        },
        dataLabels: {
            enabled: false
        }
    };

    const orderFunnelOptions = {
        chart: {
            type: 'bar',
            height: 50,
            sparkline: { enabled: true },
            toolbar: { show: false },
            zoom: { enabled: false }
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
            enabled: false
        },
        dataLabels: {
            enabled: false
        }
    };

    const cancelFunnelOptions = {
        chart: {
            type: 'bar',
            height: 50,
            sparkline: { enabled: true },
            toolbar: { show: false },
            zoom: { enabled: false }
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
            enabled: false
        },
        dataLabels: {
            enabled: false
        }
    };

    const customerFunnelOptions = {
        chart: {
            type: 'area',
            height: 50,
            sparkline: { enabled: true },
            toolbar: { show: false },
            zoom: { enabled: false }
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
            enabled: false
        },
        dataLabels: {
            enabled: false
        }
    };

    return (
        <>
            {/* Today's Statistics Row */}
            <div className="row mb-4">
                <div className="col-12">
                    <h5 className="mb-3">Today's Statistics</h5>
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Today Videos</p>
                                    <h4 className="fw-bold mb-0">{stats.todayAllReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="calendar" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Today Approved</p>
                                    <h4 className="fw-bold text-success mb-0">{stats.todayApprovedReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="check-circle" className="fs-32 text-success"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Today Pending</p>
                                    <h4 className="fw-bold mb-0">{stats.todayPendingReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="clock" className="fs-32 text-warning"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Today Rejected</p>
                                    <h4 className="fw-bold text-danger mb-0">{stats.todayRejectedReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="shield-minus" className="fs-32 text-danger"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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
            </div>

            {/* Total Statistics Row */}
            <div className="row mb-4">
                <div className="col-12">
                    <h5 className="mb-3">Total Statistics</h5>
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Total Influencers</p>
                                    <h4 className="fw-bold mb-0">{stats.totalInfluencers.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="user" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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
                </div>
                
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Total Videos</p>
                                    <h4 className="fw-bold mb-0">{stats.totalVideos.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="video" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Approved Videos</p>
                                    <h4 className="fw-bold text-success mb-0">
                                        {stats.approved.toLocaleString()}
                                    </h4>
                                    <p className="text-dark small mb-0 mt-1">
                                        Seller: {stats.sellerReels.approved} | Influencer: {stats.influencerReels.approved} | Brand: {stats.brandReels.approved}
                                    </p>
                                </div>
                                <div>
                                    <i data-lucide="check-circle" className="fs-32 text-success"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Pending Videos</p>
                                    <h4 className="fw-bold text-warning mb-0">
                                        {stats.totalPendingReels.toLocaleString()}
                                    </h4>
                                </div>
                                <div>
                                    <i data-lucide="clock" className="fs-32 text-warning"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Rejected Videos</p>
                                    <h4 className="fw-bold text-danger mb-0">{stats.totalRejectedReels.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="shield-minus" className="fs-32 text-danger"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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

                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-2 text-dark small text-uppercase fw-semibold">Total Sellers</p>
                                    <h4 className="fw-bold mb-0">{stats.totalSellers.toLocaleString()}</h4>
                                </div>
                                <div>
                                    <i data-lucide="users" className="fs-32 text-primary"></i>
                                </div>
                            </div>
                            <div className="row align-items-center mt-3">
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
                </div>
            </div>

            {/* Recent Video Approvals */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="card-title mb-0">Recent Video Approvals</h4>
                                {/* <p className="text-dark mb-0 small">Latest approved reels</p> */}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Owner</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentReels.length > 0 ? (
                                            recentReels.map((reel, idx) => (
                                                <tr key={`${reel.reel_type}-${reel.reel_id}-${idx}`}>
                                                    <td>{reel.date_added ? new Date(reel.date_added).toLocaleDateString() : '-'}</td>
                                                    <td className="text-capitalize">{reel.reel_type || '-'}</td>
                                                    <td>{reel.owner_name || '-'}</td>
                                                    <td>
                                                        <span className="badge bg-success">Approved</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center text-muted">No recent approved reels</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* <div className="card-footer border-top text-center p-3">
                            <Link to="/videos" className="link-primary text-decoration-underline fw-medium">
                                Show More <i className="ri-arrow-right-up-line"></i>
                            </Link>
                        </div> */}
                    </div>
                </div>
            </div>
        </>
    );
}
