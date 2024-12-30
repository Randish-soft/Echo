// src/App.tsx

import { useState } from 'react';
import './App.css';

function App() {
    // Whether the sign-up modal is open
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState(''); // track email errors

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(''); // track password errors

    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState(''); // track confirm password errors

    const [rememberMe, setRememberMe] = useState(false);

    // Password strength checks
    const [hasMinLength, setHasMinLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);

    // Open/close modal
    const handleOpenSignUp = () => setIsSignUpOpen(true);
    const handleCloseSignUp = () => {
        // Clear fields/state when closing
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRememberMe(false);

        // Reset errors
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        // Reset password checks
        setHasMinLength(false);
        setHasUppercase(false);
        setHasNumber(false);
        setHasSpecialChar(false);

        setIsSignUpOpen(false);
    };

    // Validate email on blur
    const validateEmail = (value: string) => {
        setEmail(value);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
    };

    // Check password strength each time user types
    const handlePasswordChange = (value: string) => {
        setPassword(value);

        setHasMinLength(value.length >= 8);
        setHasUppercase(/[A-Z]/.test(value));
        setHasNumber(/[0-9]/.test(value));
        setHasSpecialChar(/[^A-Za-z0-9]/.test(value));

        // "strong enough" error if criteria not met
        if (
            value.length > 0 &&
            (value.length < 8 ||
                !/[A-Z]/.test(value) ||
                !/[0-9]/.test(value) ||
                !/[^A-Za-z0-9]/.test(value))
        ) {
            setPasswordError('Password is not strong enough');
        } else {
            setPasswordError('');
        }
    };

    // Confirm password on blur or change
    const handleConfirmPassword = (value: string) => {
        setConfirmPassword(value);
        if (value && value !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    // Sign-up submission
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (emailError || passwordError || confirmPasswordError) {
            return alert('Please fix the errors before submitting.');
        }

        // Check that passwords match
        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }

        // Check that all password criteria are met
        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
            return alert('Please meet all password criteria.');
        }

        // Send data to your backend
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe }),
            });
            const data = await response.json();

            if (response.ok) {
                alert('Sign-up successful!');
                handleCloseSignUp();
            } else {
                alert(`Sign-up failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Server error. Please try again.');
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
                    <button className="nav-btn signup-btn" onClick={handleOpenSignUp}>
                        Sign Up
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h2 className="hero-title">
                        Ever <span className="text-red">suffered</span> with{' '}
                        <span className="text-teal">code documentation?</span>
                    </h2>
                    <p className="hero-subtitle">
                        Give it another <span className="text-green">chance</span> with{' '}
                        <span className="text-teal">echo</span>
                    </p>
                    <button className="cta-btn">Try now</button>
                </div>
            </section>

            {/* Info / Feature Section */}
            <section className="info-section">
                <div className="code-tree-container">
          <pre className="code-tree">
{`Project
├── fe
│   └── src
├── be
│   └── app
│       └── Pages
│          ├──App.tsx
│          ├──LandingPage.tsx
│       └──CSS
│          ├──Navbar.css
│          ├──searchbar.css
│          └──ColorPalette.css
├── DB
│   └── init.sql
└── docker-compose.yml
`}
          </pre>
                </div>
                <div className="info-text">
                    <h3>
                        Create manuals that use <span className="text-teal">code sectioning</span>. Documenting only the idea of
                        selected parts<span className="asterisk">*</span>
                    </h3>
                    <p className="note">
                        <span className="asterisk">*</span> Code documentation and <span className="api-color">API</span> get their
                        own special treatment
                    </p>
                </div>
            </section>

            {/* SIGN-UP MODAL */}
            {isSignUpOpen && (
                <div className="modal-overlay" onClick={handleCloseSignUp}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={handleCloseSignUp}>
                            ×
                        </button>

                        {/* Thank You Section */}
                        <div className="thank-you-section">
                            <p className="thank-you-text">Thank You for Thinking of Us &lt;3</p>
                        </div>

                        <form onSubmit={handleSignUpSubmit} className="signup-form">
                            {/* Email Field */}
                            <label htmlFor="email" className="signup-label">
                                Email <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="example@example.com"
                                value={email}
                                required
                                onBlur={(e) => validateEmail(e.target.value)}
                                onChange={(e) => setEmail(e.target.value)}
                                className="signup-input"
                            />
                            {emailError && <p className="error-text">{emailError}</p>}

                            {/* Password Field */}
                            <label htmlFor="password" className="signup-label">
                                Password <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                required
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                className="signup-input"
                            />
                            {passwordError && <p className="error-text">{passwordError}</p>}

                            {/* Confirm Password */}
                            <label htmlFor="confirmPassword" className="signup-label">
                                Confirm Password <span className="required-asterisk">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                required
                                onBlur={(e) => handleConfirmPassword(e.target.value)}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="signup-input"
                            />
                            {confirmPasswordError && <p className="error-text">{confirmPasswordError}</p>}

                            {/* Remember password checkbox */}
                            <div className="remember-me-container">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="remember-me-checkbox"
                                />
                                <label htmlFor="rememberMe" className="remember-me-label">
                                    Remember password
                                </label>
                            </div>

                            {/* Password Criteria */}
                            <div className="password-criteria">
                                <p className="criteria-title">Password Criteria:</p>
                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasMinLength}
                                        className="criteria-checkbox"
                                        id="minLengthCheck"
                                    />
                                    <label htmlFor="minLengthCheck" className="criteria-label">
                                        At least 8 characters
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasUppercase}
                                        className="criteria-checkbox"
                                        id="uppercaseCheck"
                                    />
                                    <label htmlFor="uppercaseCheck" className="criteria-label">
                                        At least 1 uppercase letter
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasNumber}
                                        className="criteria-checkbox"
                                        id="numberCheck"
                                    />
                                    <label htmlFor="numberCheck" className="criteria-label">
                                        At least 1 number
                                    </label>
                                </div>

                                <div className="criteria-item">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={hasSpecialChar}
                                        className="criteria-checkbox"
                                        id="specialCheck"
                                    />
                                    <label htmlFor="specialCheck" className="criteria-label">
                                        At least 1 special character
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="cta-btn submit-btn">
                                Start Documenting
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
