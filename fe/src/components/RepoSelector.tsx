// src/components/RepoSelector.tsx
import React from 'react';
import { Repo } from '../utils/types';

interface RepoSelectorProps {
    repos: Repo[];
    onSelect: (repo: Repo) => void;
}

const RepoSelector: React.FC<RepoSelectorProps> = ({ repos, onSelect }) => {
    return (
        <div>
            <h2>Select a Repository</h2>
            <ul>
                {repos.map((repo) => (
                    <li key={repo.url} onClick={() => onSelect(repo)}>
                        {repo.name} - {repo.language}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RepoSelector;
