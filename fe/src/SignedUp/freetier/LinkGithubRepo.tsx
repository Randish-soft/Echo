import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import "./CSS/repolinking.css";

interface Repo {
    id: number;
    full_name: string;
}

const LinkGithubRepo: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const accessToken = urlParams.get('token');
        if (accessToken) {
            setToken(accessToken);
            fetchRepositories(accessToken);
        }
    }, [location.search]);

    const handleGithubSignIn = () => {
        window.location.href = 'http://localhost:5000/auth/github';
    };

    const fetchRepositories = async (accessToken: string) => {
        try {
            const response = await fetch('http://localhost:5000/auth/github/repos', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data: Repo[] = await response.json();
            setRepos(data);
        } catch (error) {
            console.error('Error fetching repositories:', error);
        }
    };

    const handleRepoSelect = (repoName: string) => {
        setSelectedRepo(repoName);
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
