import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1>404 - Page Not Found</h1>
            <p>Sorry, the page you are looking for doesn't exist.</p>
        </div>
    );
}

