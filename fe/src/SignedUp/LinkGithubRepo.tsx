/** fe/src/SignedUp/LinkGithubRepo.tsx */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./CSS/repolinking.css";
import "../global-css/navbar.css";

interface Repo {
    id: number;
    full_name: string;
    html_url: string;
}

const LinkGithubRepo: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const accessToken = urlParams.get('token');
        if (accessToken) {
            setToken(accessToken);
            fetchRepositories(accessToken);
        }
    }, [location.search]);

    /**
     * If user isn’t linked to GitHub yet, direct them to your OAuth route.
     */
    const handleGithubSignIn = () => {
        window.location.href = 'http://localhost:5001/auth/github';
    };

    /**
     * Fetch user repos from GitHub using the token.
     */
    const fetchRepositories = async (accessToken: string) => {
        try {
            const response = await fetch('https://api.github.com/user/repos?per_page=100', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Unable to fetch GitHub repos');
            }
            const data: Repo[] = await response.json();
            setRepos(data);
        } catch (error) {
            console.error('Error fetching repositories:', error);
        }
    };

    /**
     * When a user selects a repo, go to /document-page?repo=...&token=...
     */
    const handleRepoSelect = (repoFullName: string) => {
        setSelectedRepo(repoFullName);
        alert(`You have linked to the repository: ${repoFullName}`);
        navigate(`/document-page?repo=${encodeURIComponent(repoFullName)}&token=${token || ''}`);
    };

    /**
     * If user clicks the brand, go home ("/") or wherever you prefer
     */
    const handleBrandClick = () => {
        navigate('/');
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh' }}>
            {/* CUSTOM NAVBAR (no more "navbar-light bg-white border-bottom px-3") */}
            <nav className="navbar">
                <h1 className="brand" onClick={handleBrandClick}>
                    echo
                </h1>
                {/* Example of nav-right usage if you want extra buttons:
        <div className="nav-right">
          <button className="nav-btn" onClick={() => navigate('/somewhere')}>Docs</button>
          <button className="nav-btn signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
        */}
            </nav>

            <div className="main-container">
                <div className="github-card">
                    {/* If no token, show “Link Up GitHub” button */}
                    {!token ? (
                        <button className="github-signin-btn" onClick={handleGithubSignIn}>
                            <span className="btn-text">Link Up Your GitHub</span>
                        </button>
                    ) : (
                        <div>
                            <h3> Please Select a Repository:</h3>
                            <ul className="repo-list">
                                {repos.map((repo) => (
                                    <li key={repo.id}>
                                        <button
                                            className="repo-btn"
                                            onClick={() => handleRepoSelect(repo.full_name)}
                                        >
                                            {repo.full_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {selectedRepo && (
                                <p className="selected-repo">
                                    You selected: <strong>{selectedRepo}</strong>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkGithubRepo;
