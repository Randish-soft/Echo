// src/pages/SignUpPage.tsx

import React, { useState } from 'react';
import '../App.css'; // Reuse the global landing page styles

function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage('Account created successfully! You can now log in.');
                setEmail('');
                setPassword('');
            } else {
                setMessage(data.message || 'Sign-up failed. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Server error. Please try again later.');
        }
    };

    return (
        <div className="landing-page">
            {/* Header / Navigation */}
            <header className="navbar">
                <div className="nav-left">
                    <h1 className="brand">echo</h1>
                </div>
                <div className="nav-right">
                    <button className="nav-btn">Log In</button>
                    <button className="nav-btn signup-btn" disabled>
                        Sign Up
                    </button>
                </div>
            </header>

            {/* Sign Up Form Section */}
            <section className="hero" style={{ height: 'auto', padding: '2rem 0' }}>
                <div className="hero-content" style={{ maxWidth: '400px' }}>
                    <h2 className="hero-title" style={{ marginBottom: '1rem' }}>
                        Create Your Account
                    </h2>
                    <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label htmlFor="email" style={{ textAlign: 'left', fontWeight: 'bold' }}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '1rem',
                            }}
                        />

                        <label htmlFor="password" style={{ textAlign: 'left', fontWeight: 'bold' }}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '1rem',
                            }}
                        />

                        <button type="submit" className="cta-btn" style={{ marginTop: '1rem' }}>
                            Sign Up
                        </button>
                    </form>

                    {message && (
                        <p style={{ marginTop: '1rem', color: '#333', fontWeight: 'bold' }}>
                            {message}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default SignUpPage;
