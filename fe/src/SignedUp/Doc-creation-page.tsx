/** fe/src/SignedUp/DocumentPage.tsx */
import React, {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

import "../global-css/navbar.css";
import "./CSS/docPage.css";

/**
 * Basic shape for items in the Git tree
 */
interface TreeItem {
    path: string;           // e.g. "about/DOC_README.md"
    type: 'blob' | 'tree';  // "blob" => file, "tree" => folder
    sha: string;            // tree-level sha
}
interface GitTreeResponse {
    sha: string;
    truncated: boolean;
    tree: TreeItem[];
}

/**
 * Response from GET /contents/<path>
 */
interface GitFileContentResponse {
    content: string;        // base64-encoded file data
    sha: string;            // real content sha
    path: string;           // e.g. "about/DOC_README.md"
}

/** For branches */
interface Branch {
    name: string;
    commit: { sha: string };
}

/** Folder / File node structure for our collapsible tree */
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
    children: (FileNode | FolderNode)[];
};

/** Attempt to parse JWT from localStorage */
function parseJwt(token: string) {
    try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

/**
 * DocumentPage:
 * 1) Let user pick a file from the tree. On click, we fetch the file’s content from GitHub => load into text area.
 * 2) On commit, we PUT it back to the same path (plus `sha` if we have one).
 */
const DocumentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // For user’s login state
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // For GitHub
    const [token, setToken] = useState('');
    const [repoFullName, setRepoFullName] = useState('');

    // The text content we’re editing
    const [docContent, setDocContent] = useState('');
    // The path to the file we’re editing
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    // The content sha for that file (so we can update it if it already exists)
    const [contentSha, setContentSha] = useState<string | null>(null);

    // “Saved!” after no typing for 1s
    const [isSaved, setIsSaved] = useState(false);

    // Branch data
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    // The raw tree plus a nested structure
    const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
    const [nestedTree, setNestedTree] = useState<(FileNode | FolderNode)[]>([]);

    // For debouncing
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

    /** 1) On mount, parse local JWT for loggedInUser */
    useEffect(() => {
        const storedToken = localStorage.getItem('myAppToken');
        if (storedToken) {
            const decoded = parseJwt(storedToken);
            if (decoded && decoded.username) setLoggedInUser(decoded.username);
        }
    }, []);

    /** 2) Grab ?repo=owner/repo & ?token=... from URL, fetch branches */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const repoParam = params.get('repo') || '';
        const tokenParam = params.get('token') || '';

        setRepoFullName(repoParam);
        setToken(tokenParam);

        if (repoParam && tokenParam) {
            fetchBranches(repoParam, tokenParam);
        }
    }, [location.search]);

    /** =========== NAVBAR / BURGER MENU STUFF ============ */
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const handleOverlayClick = () => setIsMenuOpen(false);
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
    const handleMenuItemClick = (path: string) => {
        navigate(path);
        setIsMenuOpen(false);
    };
    const handleLogout = () => {
        localStorage.removeItem('myAppToken');
        setLoggedInUser(null);
        setIsMenuOpen(false);
        navigate('/');
    };

    /** 3) fetchBranches => pick “main” => fetch tree */
    async function fetchBranches(repo: string, accessToken: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const branchesUrl = `https://api.github.com/repos/${owner}/${repoName}/branches`;
            const resp = await fetch(branchesUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!resp.ok) throw new Error(`Error fetching branches`);
            const data: Branch[] = await resp.json();
            setBranches(data);

            if (data.length > 0) {
                const main = data.find(b => b.name === 'main') || data[0];
                setSelectedBranch(main.name);
                fetchFileTree(repo, accessToken, main.commit.sha);
            }
        } catch (err) {
            console.error('fetchBranches error:', err);
        }
    }

    /** 4) fetch the entire directory tree for selected commit */
    async function fetchFileTree(repo: string, accessToken: string, commitSha: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${commitSha}?recursive=1`;
            const resp = await fetch(treeUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!resp.ok) throw new Error('Error fetching file tree');
            const data: GitTreeResponse = await resp.json();
            setTreeItems(data.tree);
        } catch (err) {
            console.error('fetchFileTree error:', err);
        }
    }

    /** 5) Once we have the raw tree, build a nested structure for display. */
    useEffect(() => {
        if (treeItems.length === 0) {
            setNestedTree([]);
            // Clear out the doc editor if we like
            setCurrentFilePath(null);
            setContentSha(null);
            setDocContent('');
            return;
        }
        const root = buildNestedTree(treeItems);
        setNestedTree(root);
    }, [treeItems]);

    /**
     * If user changes branch => fetch tree for that branch’s commit
     */
    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBranch = e.target.value;
        setSelectedBranch(newBranch);

        const br = branches.find(b => b.name === newBranch);
        if (br) {
            fetchFileTree(repoFullName, token, br.commit.sha);
            // Clear the doc editor
            setCurrentFilePath(null);
            setContentSha(null);
            setDocContent('');
        }
    };

    /**
     * 6) If user clicks a file in the tree => load it from GitHub /contents/<path>?ref=<branch>
     */
    async function handleFileClick(filePath: string) {
        try {
            setCurrentFilePath(filePath);
            setContentSha(null);
            setDocContent('');  // clear temporarily

            const [owner, repoName] = repoFullName.split('/');
            const contentsUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${selectedBranch}`;
            const resp = await fetch(contentsUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) {
                console.warn('File not found or 404, status=', resp.status);
                return;
            }
            const data: GitFileContentResponse = await resp.json();
            const decoded = atob(data.content);
            setDocContent(decoded);
            setContentSha(data.sha);
        } catch (err) {
            console.error('handleFileClick error:', err);
        }
    }

    /**
     * 7) On doc change => autosave after 1s
     */
    const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDocContent(e.target.value);
        setIsSaved(false);

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            setIsSaved(true);
        }, 1000);
    };

    /**
     * 8) On commit => PUT /contents/<currentFilePath>?ref=<branch>
     * If we have contentSha => we supply it to update existing file
     * If not => GitHub creates a new file
     */
    const handleCommitToGithub = useCallback(async () => {
        if (!repoFullName || !token || !selectedBranch) return;
        if (!currentFilePath) {
            alert('No file chosen! Click a file in the tree first.');
            return;
        }
        try {
            const [owner, repoName] = repoFullName.split('/');
            const base64Content = btoa(docContent || '');
            const message = `Update doc from DocumentPage on branch ${selectedBranch}`;

            const bodyData: any = {
                message,
                content: base64Content,
            };
            if (contentSha) {
                bodyData.sha = contentSha;
            }

            const putUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${currentFilePath}?ref=${selectedBranch}`;
            const resp = await fetch(putUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(`GitHub commit failed: ${msg}`);
            }
            alert('Committed to GitHub successfully!');
        } catch (err) {
            console.error('commit error:', err);
            alert(`Error committing to GitHub: ${err}`);
        }
    }, [repoFullName, token, selectedBranch, currentFilePath, docContent, contentSha]);

    // “Back” button
    const goBack = () => navigate(-1);

    return (
        <>
            {/* NAVBAR */}
            <header className="navbar">
                <div className="nav-left">
                    <h1 className="brand" onClick={() => navigate('/')}>
                        echo
                    </h1>
                </div>
                <div className="nav-right">
                    {loggedInUser ? (
                        <nav className="nav-container">
                            <div className="burger-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <FiMenu size={24} />
                            </div>
                        </nav>
                    ) : (
                        <>
                            <button className="nav-btn" onClick={() => navigate('/login')}>
                                Log In
                            </button>
                            <button className="nav-btn signup-btn" onClick={() => navigate('/signup')}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </header>

            {loggedInUser && isMenuOpen && (
                <div className="menu-overlay" onClick={handleOverlayClick}>
                    <div className="nav-items" onClick={stopPropagation}>
                        <div className="nav-item" onClick={() => handleMenuItemClick('/dashboard')}>
                            Dashboard
                        </div>
                        <div className="nav-item" onClick={() => handleMenuItemClick('/documents')}>
                            My Documents
                        </div>
                        <div className="nav-item" onClick={() => handleMenuItemClick('/settings')}>
                            Settings
                        </div>
                        <div className="nav-item" onClick={() => handleMenuItemClick('/faq')}>
                            FAQ
                        </div>
                        <div className="nav-item" onClick={handleLogout}>
                            Logout
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN LAYOUT */}
            <div className="doc-container">
                {/* Left Pane: tree */}
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
                    <FileTree
                        nodes={nestedTree}
                        onFileClick={handleFileClick}
                    />
                </div>

                {/* Right Pane: doc editor */}
                <div className="doc-right-pane">
                    <h2>Documentation Editor</h2>
                    <textarea
                        className="doc-textarea"
                        placeholder="(Click a file in the tree on the left to load here!)"
                        value={docContent}
                        onChange={handleDocChange}
                    />
                    <div className="editor-footer">
                        <button className="btn" onClick={goBack}>Back</button>
                        {isSaved && docContent ? (
                            <span className="autosave-status">Saved!</span>
                        ) : (
                            <span className="autosave-status" style={{ color: "#999" }}>
                &nbsp;
              </span>
                        )}
                        <button className="btn commit-btn" onClick={handleCommitToGithub}>
                            Commit to GitHub
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DocumentPage;

/**
 * Build a nested folder structure from the flat tree items
 */
function buildNestedTree(items: TreeItem[]): (FileNode | FolderNode)[] {
    const root: (FileNode | FolderNode)[] = [];
    for (const item of items) {
        const parts = item.path.split('/');
        insertPath(root, parts, item);
    }
    return root;
}

function insertPath(
    current: (FileNode | FolderNode)[],
    parts: string[],
    item: TreeItem
) {
    const [first, ...rest] = parts;
    if (rest.length === 0) {
        // final => file or folder
        if (item.type === 'blob') {
            current.push({
                name: first,
                type: 'file',
                path: item.path,
                sha: item.sha,
            });
        } else {
            current.push({
                name: first,
                type: 'folder',
                path: item.path,
                sha: item.sha,
                children: [],
            });
        }
        return;
    }
    let folder = current.find(n => n.type === 'folder' && n.name === first) as FolderNode | undefined;
    if (!folder) {
        folder = {
            name: first,
            type: 'folder',
            path: '',
            sha: '',
            children: [],
        };
        current.push(folder);
    }
    insertPath(folder.children, rest, item);
}

/** Collapsible tree that calls onFileClick() for each file */
function FileTree({
                      nodes,
                      onFileClick
                  }: {
    nodes: (FileNode | FolderNode)[],
    onFileClick: (filePath: string) => void
}) {
    return (
        <ul className="file-tree">
            {nodes.map(node => (
                <FileNodeUI key={`${node.type}-${node.path || node.name}`} node={node} onFileClick={onFileClick} />
            ))}
        </ul>
    );
}

function FileNodeUI({
                        node,
                        onFileClick
                    }: {
    node: FileNode | FolderNode,
    onFileClick: (filePath: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false);

    if (node.type === 'file') {
        return (
            <li className="file-item">
                <button
                    className="file-icon-btn"
                    onClick={() => onFileClick(node.path)}
                >
                    <span className="file-icon">📄</span>
                    {node.name}
                </button>
            </li>
        );
    } else {
        const toggleOpen = () => setIsOpen(!isOpen);
        return (
            <li className="folder-item">
                <div className="folder-label" onClick={toggleOpen}>
                    <span className="folder-arrow">{isOpen ? '▼' : '▶'}</span>
                    <span className="folder-icon">📁</span> {node.name}
                </div>
                {isOpen && (
                    <ul className="folder-children">
                        {node.children.map(child => (
                            <FileNodeUI
                                key={`${child.type}-${child.path || child.name}`}
                                node={child}
                                onFileClick={onFileClick}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }
}
