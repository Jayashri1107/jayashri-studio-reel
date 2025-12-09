import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SellerProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Simulate loading products
        setTimeout(() => {
            setProducts([
                {
                    id: 1,
                    name: 'Summer Dress',
                    sku: 'SD-001',
                    price: 29.99,
                    stock: 50,
                    status: 'active'
                },
                {
                    id: 2,
                    name: 'Winter Coat',
                    sku: 'WC-002',
                    price: 89.99,
                    stock: 25,
                    status: 'active'
                },
                {
                    id: 3,
                    name: 'Spring Shoes',
                    sku: 'SS-003',
                    price: 49.99,
                    stock: 30,
                    status: 'inactive'
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge bg-success">Active</span>;
            case 'inactive':
                return <span className="badge bg-secondary">Inactive</span>;
            default:
                return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">My Products</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Product Management</h5>
                        <button className="btn btn-success">
                            <i className="ri-add-line me-1"></i> Add Product
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No products found</h5>
                                <p className="text-muted">Add your first product to get started.</p>
                                <button className="btn btn-success">
                                    <i className="ri-add-line me-1"></i> Add Product
                                </button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>SKU</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td>{product.name}</td>
                                                <td>{product.sku}</td>
                                                <td>${product.price}</td>
                                                <td>{product.stock}</td>
                                                <td>{getStatusBadge(product.status)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-soft-info me-1">
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-soft-warning me-1">
                                                        <i className="ri-edit-line"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-soft-danger">
                                                        <i className="ri-delete-bin-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}