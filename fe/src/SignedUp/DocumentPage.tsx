import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../global-css/navbar.css";
import "./CSS/DocPage.css";
import { FiFileText, FiFile, FiFolder } from 'react-icons/fi';
import { FaJsSquare, FaCss3Alt, FaHtml5 } from 'react-icons/fa';
import { IoIosImage } from 'react-icons/io';
import { marked } from 'marked';

interface TreeItem {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

interface GitTreeResponse {
    sha: string;
    url: string;
    tree: TreeItem[];
    truncated: boolean;
}

interface Branch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

type FileNode = {
    name: string;
    type: 'file';
    path: string;
    sha: string;
};

type FolderNode = {
    name: string;
    type: 'folder';
    path: string;
    sha: string;
    children: (FolderNode | FileNode)[];
};


const DocumentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState('');
    const [repoFullName, setRepoFullName] = useState('');
    const [docContent, setDocContent] = useState('');
    const [isAutosaved, setIsAutosaved] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
    const [nestedTree, setNestedTree] = useState<(FolderNode | FileNode)[]>([]);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const handlePreview = () => {
        const htmlContent = marked(docContent); // Convert Markdown to HTML
        const previewWindow = window.open("", "_blank"); // Open new tab
        
        if (previewWindow) {
            previewWindow.document.write(`
                <html>
                <head>
                    <title>Markdown Preview</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; }
                        h1, h2, h3 { color: #333; }
                        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>${htmlContent}</body>
                </html>
            `);
            previewWindow.document.close();
        } else {
            alert("Failed to open preview window. Please allow pop-ups.");
        }
    };
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const r = params.get('repo') || '';
        const t = params.get('token') || '';

        setRepoFullName(r);
        setToken(t);

        if (r && t) {
            fetchBranches(r, t);
        }

        const savedDocContent = localStorage.getItem('docContent');
        if (savedDocContent) {
            setDocContent(savedDocContent);
        }
    }, [location.search]);

    async function fetchBranches(repo: string, accessToken: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const url = `https://api.github.com/repos/${owner}/${repoName}/branches`;
            const resp = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!resp.ok) throw new Error('Could not fetch branches');
            const data: Branch[] = await resp.json();
            setBranches(data);

            if (data.length > 0) {
                const mainBranch = data.find(b => b.name === 'main') || data[0];
                setSelectedBranch(mainBranch.name);
                fetchFileTree(repo, accessToken, mainBranch.commit.sha);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchFileTree(repo: string, accessToken: string, commitSha: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const url = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${commitSha}?recursive=1`;
            const resp = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!resp.ok) throw new Error('Could not fetch file tree');
            const data: GitTreeResponse = await resp.json();
            setTreeItems(data.tree);
        } catch (err) {
            console.error('Error fetching file tree:', err);
        }
    }

    useEffect(() => {
        if (treeItems.length === 0) {
            setNestedTree([]);
            return;
        }
        const root = buildNestedTree(treeItems);
        setNestedTree(root);
    }, [treeItems]);

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBranch = e.target.value;
        setSelectedBranch(newBranch);
        const br = branches.find(b => b.name === newBranch);
        if (br) {
            fetchFileTree(repoFullName, token, br.commit.sha);
        }
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setDocContent(newValue);
        setIsAutosaved(false);

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            console.log('Autosaved:', newValue);
            setIsAutosaved(true);
            localStorage.setItem('docContent', newValue);
        }, 1000);
    };

    const getFileSha = useCallback(async (path: string) => {
        if (!repoFullName || !token || !selectedBranch) return null;

        const [owner, repoName] = repoFullName.split('/');
        const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${selectedBranch}`;
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!resp.ok) {
            console.error('Failed to fetch file SHA');
            return null;
        }

        const data = await resp.json();
        return data.sha;
    }, [repoFullName, token, selectedBranch]);

    const handleCommitToGithub = useCallback(async () => {
        if (!repoFullName || !token || !selectedBranch) return;

        const path = 'DOC_README.md';
        let sha = await getFileSha(path);

        if (sha === null) return;

        const base64Content = btoa(docContent || '');
        const message = `Update doc from DocumentPage on branch ${selectedBranch}`;

        try {
            const [owner, repoName] = repoFullName.split('/');
            const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${selectedBranch}`;

            const resp = await fetch(url, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.github+json',
                },
                body: JSON.stringify({
                    message,
                    content: base64Content,
                    sha,
                }),
            });

            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(`GitHub commit failed: ${msg}`);
            }

            alert('Committed to GitHub successfully!');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err) {
            console.error(err);
            alert(`Error committing to GitHub: ${err}`);
        }
    }, [docContent, repoFullName, selectedBranch, token, getFileSha]);

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="doc-container">
            <div className="doc-left-pane">
                <h3>Repository Tree</h3>
                <div className="branch-selector">
                    <label>
                        Branch:
                        <select value={selectedBranch} onChange={handleBranchChange}>
                            {branches.map(b => (
                                <option key={b.name} value={b.name}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <FileTree nodes={nestedTree} />
            </div>

            <div className="doc-right-pane">
                    <h2>Documentation Editor</h2>
                    <textarea
                        className="doc-textarea"
                        placeholder="Type your doc here..."
                        value={docContent}
                        onChange={handleDocChange}
                    />
                    <div className="editor-footer">
        <button className="btn" onClick={goBack}>Back</button>
        {isAutosaved ? (
            <span className="autosave-status">Autosaved</span>
        ) : (
            <span className="autosave-status typing">Typing...</span>
        )}
        <button className="btn preview-btn" onClick={handlePreview}>Preview</button>
        <button className="btn commit-btn" onClick={handleCommitToGithub}>Commit to GitHub</button>
    </div>

            </div>
        </div>
    );
};

function buildNestedTree(treeItems: TreeItem[]): (FolderNode | FileNode)[] {
    const rootNodes: (FolderNode | FileNode)[] = [];
    for (const item of treeItems) {
        const parts = item.path.split('/');
        insertPath(rootNodes, parts, item);
    }
    return rootNodes;
}

function insertPath(currentLevel: (FolderNode | FileNode)[], parts: string[], item: TreeItem) {
    const [first, ...rest] = parts;
    if (rest.length === 0) {
        if (item.type === 'blob') {
            currentLevel.push({ name: first, type: 'file', path: item.path, sha: item.sha });
        } else {
            currentLevel.push({ name: first, type: 'folder', path: item.path, sha: item.sha, children: [] });
        }
        return;
    }

    let folderNode = currentLevel.find(n => n.type === 'folder' && n.name === first) as FolderNode | undefined;
    if (!folderNode) {
        folderNode = { name: first, type: 'folder', path: '', sha: '', children: [] };
        currentLevel.push(folderNode);
    }
    insertPath(folderNode.children, rest, item);
}

function FileTree({ nodes }: { nodes: (FolderNode | FileNode)[] }) {
    // Sort folders first, then files, in alphabetical order
    nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <ul className="file-tree">
            {nodes.map(node => (
                <FileNodeUI key={`${node.type}-${node.path || node.name}`} node={node} />
            ))}
        </ul>
    );
}

function FileNodeUI({ node }: { node: FolderNode | FileNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        const icons: { [key: string]: React.ReactNode } = {
            md: <FiFileText color="green" />,
            js: <FaJsSquare color="yellow" />,
            ts: <FaJsSquare color="blue" />,
            json: <FiFile color="orange" />,
            txt: <FiFileText color="gray" />,
            css: <FaCss3Alt color="blue" />,
            html: <FaHtml5 color="red" />,
            png: <IoIosImage color="purple" />,
            jpg: <IoIosImage color="purple" />,
            svg: <IoIosImage color="purple" />,
            default: <FiFile color="black" />,
        };

        return icons[extension as string] || icons['default'];
    };

    if (node.type === 'file') {
        const fileIcon = getFileIcon(node.name);

        return (
            <li className="file-item">
                <span className="file-icon">{fileIcon}</span> {node.name}
            </li>
        );
    } else {
        const toggleOpen = () => setIsOpen(!isOpen);
        return (
            <li className="folder-item">
                <div className="folder-label" onClick={toggleOpen}>
                    <span className="folder-arrow">{isOpen ? '▼' : '▶'}</span>
                    <span className="folder-icon"><FiFolder color="brown" /></span> {node.name}
                </div>
                {isOpen && (
                    <ul className="folder-children">
                        {node.children.map(child => (
                            <FileNodeUI key={`${child.type}-${child.path || child.name}`} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }
}

export default DocumentPage;
