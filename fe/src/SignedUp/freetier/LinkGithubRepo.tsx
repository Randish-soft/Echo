// LinkGithubRepo.tsx
import React from 'react';

// If you want icons, you could install "bootstrap-icons" or "react-icons" etc.
// For demonstration, we’ll just put a placeholder in the button.

const LinkGithubRepo: React.FC = () => {
    const handleMenuClick = () => {
        // For example, toggle a sidebar or do something else
        alert('Menu button clicked!');
    };

    const handleAvatarClick = () => {
        // Could open a user profile menu, for instance
        alert('Avatar clicked!');
    };

    const handleGithubSignIn = () => {
        // Here you would redirect to your backend GitHub OAuth flow
        alert('Signing in with GitHub...');
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh' }}>
            {/* HEADER / NAVBAR */}
            <nav className="navbar navbar-light bg-white border-bottom px-3">
                <div className="d-flex align-items-center">
                    {/* “Hamburger” menu icon */}
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={handleMenuClick}
                    >
                        {/* Some icon or just 3 lines */}
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <span className="navbar-brand mb-0 h1">echo</span>
                </div>

                {/* Right side: user avatar (or icon) */}
                <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                    <img
                        src="https://via.placeholder.com/40x40.png?text=User"
                        alt="User Avatar"
                        style={{ borderRadius: '50%' }}
                    />
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: '80vh' }}
            >
                {/* The pinkish card */}
                <div
                    className="text-center p-4"
                    style={{
                        backgroundColor: '#d9a7a7', // or a different pinkish shade
                        borderRadius: '8px',
                        width: '350px',
                        maxWidth: '90%',
                    }}
                >
                    <h2 style={{ marginBottom: '1.5rem' }}>Let’s Link Your GitHub Rep :D</h2>

                    {/* GitHub Sign-In Button */}
                    <button
                        className="btn btn-dark d-inline-flex align-items-center"
                        onClick={handleGithubSignIn}
                    >
                        {/* If you have an icon library, you could insert an actual GitHub icon here. */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            fill="currentColor"
                            className="bi bi-github me-2"
                            viewBox="0 0 16 16"
                        >
                            <path d="M8 0C3.58 0 0 3.58 ... (GitHub icon path data) ..." />
                        </svg>
                        Sign in with GitHub
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkGithubRepo;
