import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import "./CSS/repolinking.css";
import "../../global-css/navbar.css"
/** Basic Repo interface to represent GitHub's response */
interface Repo {
    id: number;
    full_name: string;
    html_url: string;
    // Add any other fields you need from GitHub's API
}

const LinkGithubRepo: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    // We'll parse the URL to find ?token=...
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const accessToken = urlParams.get('token');
        if (accessToken) {
            setToken(accessToken);
            fetchRepositories(accessToken);
        }
    }, [location.search]);

    /**
     * If user hasn't yet authorized, we send them to your server’s
     * GitHub OAuth route or directly to GitHub’s OAuth URL
     * (depending on how you set up your flow).
     */
    const handleGithubSignIn = () => {
        // Example: redirect to your server route that initiates OAuth
        // or directly to GitHub if you have a client-only flow
        window.location.href = 'http://localhost:5001/auth/github';
    };

    /**
     * --- Fetch Repos from GitHub’s REST API ---
     * GitHub’s list-your-repos endpoint: GET https://api.github.com/user/repos
     * We pass the token in an Authorization header.
     */
    const fetchRepositories = async (accessToken: string) => {
        try {
            const response = await fetch('https://api.github.com/user/repos?per_page=100', {
                headers: {
                    // For OAuth app tokens, use 'token' or 'Bearer'
                    // (GitHub accepts both). Example:
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

    const handleRepoSelect = (repoName: string) => {
        setSelectedRepo(repoName);
        // You can store this selection or navigate somewhere
        alert(`You have linked to the repository: ${repoName}`);
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh' }}>
            <nav className="navbar navbar-light bg-white border-bottom px-3">
                <span className="navbar-brand mb-0 h1">echo</span>
            </nav>

            <div className="main-container">
                <div className="github-card">
                    <h2 className="card-title">Let’s Link Your GitHub Repo :D</h2>
                    {!token ? (
                        <button className="github-signin-btn" onClick={handleGithubSignIn}>
                            <span className="btn-text">Link Up Your GitHub</span>
                        </button>
                    ) : (
                        <div>
                            <h3>Select a Repository:</h3>
                            <ul className="repo-list">
                                {repos.map((repo) => (
                                    <li key={repo.id}>
                                        <button
                                            className="btn btn-outline-primary repo-btn"
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
