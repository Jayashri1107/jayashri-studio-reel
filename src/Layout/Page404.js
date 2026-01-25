import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page404() {
    const navigate = useNavigate();
    
    return (
        <div className="container text-center mt-5">
            <h1>404</h1>
            <p>Page Not Found</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
                Go to Home
            </button>
        </div>
    );
}

