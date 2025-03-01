/** fe/src/SignedUp/DocumentPage.tsx */
import React, {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../global-css/navbar.css";
import "./CSS/DocPage.css";

/**
 * For the file tree, we’ll fetch from:
 * GET /repos/:owner/:repo/git/trees/:branchOrSha?recursive=1
 */
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

/**
 * We’ll build a nested tree structure:
 * FolderNode -> children[] of FolderNode or FileNode
 */
type FileNode = {
    name: string;
    type: 'file';
    path: string;   // full path
    sha: string;
};

type FolderNode = {
    name: string;
    type: 'folder';
    path: string;   // full path
    sha: string;
    children: (FolderNode | FileNode)[];
};

/**
 * DocumentPage:
 * - Left pane: a collapsible file tree
 * - Right pane: doc text area (autosave)
 * - Branch selection (from a dropdown)
 * - “Commit to GitHub” button => PUT /repos/:owner/:repo/contents/path?ref=branchName
 */
const DocumentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState('');
    const [repoFullName, setRepoFullName] = useState('');

    // For the doc content
    const [docContent, setDocContent] = useState('');
    const [isAutosaved, setIsAutosaved] = useState(false);

    // Branch data
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    // Raw items from GitHub
    const [treeItems, setTreeItems] = useState<TreeItem[]>([]);

    // Our nested folder/file structure
    const [nestedTree, setNestedTree] = useState<(FolderNode|FileNode)[]>([]);

    // For debouncing autosave
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // parse ?repo=owner/repo&token=gho_... from the URL
        const params = new URLSearchParams(location.search);
        const r = params.get('repo') || '';
        const t = params.get('token') || '';

        setRepoFullName(r);
        setToken(t);

        if (r && t) {
            fetchBranches(r, t);
        }
    }, [location.search]);

    /**
     * 1) Fetch all branches from the user’s GitHub repo
     */
    async function fetchBranches(repo: string, accessToken: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const url = `https://api.github.com/repos/${owner}/${repoName}/branches`;
            const resp = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!resp.ok) {
                throw new Error('Could not fetch branches');
            }
            const data: Branch[] = await resp.json();
            setBranches(data);

            if (data.length > 0) {
                // default to first branch or "main" if found
                const mainBranch = data.find(b => b.name === 'main') || data[0];
                setSelectedBranch(mainBranch.name);
                // Once we have a branch, fetch the tree
                fetchFileTree(repo, accessToken, mainBranch.commit.sha);
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * 2) Fetch file tree for the selected branch (commit SHA)
     */
    async function fetchFileTree(repo: string, accessToken: string, commitSha: string) {
        try {
            const [owner, repoName] = repo.split('/');
            const url = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${commitSha}?recursive=1`;
            const resp = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!resp.ok) {
                throw new Error('Could not fetch file tree');
            }
            const data: GitTreeResponse = await resp.json();
            setTreeItems(data.tree);
        } catch (err) {
            console.error('Error fetching file tree:', err);
        }
    }

    /**
     * Build a nested structure out of the flat tree items.
     * If "type === tree", it's a folder. If "type === blob", it's a file.
     * We'll split the path by '/' to find the hierarchical structure.
     */
    useEffect(() => {
        if (treeItems.length === 0) {
            setNestedTree([]);
            return;
        }
        const root = buildNestedTree(treeItems);
        setNestedTree(root);
    }, [treeItems]);

    /**
     * When user changes the branch in the dropdown
     */
    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBranch = e.target.value;
        setSelectedBranch(newBranch);
        // find that branch to get its commit sha
        const br = branches.find(b => b.name === newBranch);
        if (br) {
            fetchFileTree(repoFullName, token, br.commit.sha);
        }
    };

    /**
     * On docContent change, we set docContent, and we reset a timer for autosave
     */
    const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setDocContent(newValue);
        setIsAutosaved(false);

        // Debounce logic
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            console.log('Autosaved:', newValue);
            setIsAutosaved(true);
        }, 1000);
    };

    /**
     * Actually commit the doc to GitHub via PUT /repos/:owner/:repo/contents/<path>?ref=<branch>
     */
    const handleCommitToGithub = useCallback(async () => {
        if (!repoFullName || !token || !selectedBranch) return;
        // We'll create or update a file named "DOC_README.md" in the repo root
        try {
            const [owner, repoName] = repoFullName.split('/');
            const path = 'DOC_README.md';
            const base64Content = btoa(docContent || '');

            const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${selectedBranch}`;
            const message = `Update doc from DocumentPage on branch ${selectedBranch}`;

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
                }),
            });

            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(`GitHub commit failed: ${msg}`);
            }

            alert('Committed to GitHub successfully!');
        } catch (err) {
            console.error(err);
            alert(`Error committing to GitHub: ${err}`);
        }
    }, [docContent, repoFullName, selectedBranch, token]);

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="doc-container">
            {/* Left Pane: Repo Tree */}
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

            {/* Right Pane: Document Editor */}
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

                    <button className="btn commit-btn" onClick={handleCommitToGithub}>
                        Commit to GitHub
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentPage;

//
// ---------------- HELPER FUNCTIONS / COMPONENTS ---------------
//

function buildNestedTree(treeItems: TreeItem[]): (FolderNode|FileNode)[] {
    // We start with an empty root array of nodes
    const rootNodes: (FolderNode|FileNode)[] = [];

    for (const item of treeItems) {
        const parts = item.path.split('/');
        insertPath(rootNodes, parts, item);
    }

    return rootNodes;
}

/**
 * Recursively insert the item into the nested structure by walking 'parts'.
 * If it’s a folder, create or find the corresponding FolderNode.
 * If it’s a file (blob), create a FileNode at the correct nesting.
 */
function insertPath(
    currentLevel: (FolderNode|FileNode)[],
    parts: string[],
    item: TreeItem
) {
    const [first, ...rest] = parts;

    // If we have no "rest," that means this is the last part => file or folder
    if (rest.length === 0) {
        if (item.type === 'blob') {
            // It's a file
            currentLevel.push({
                name: first,
                type: 'file',
                path: item.path,
                sha: item.sha,
            });
        } else {
            // It's a folder with no children? Edge case, but possible
            currentLevel.push({
                name: first,
                type: 'folder',
                path: item.path,
                sha: item.sha,
                children: [],
            });
        }
        return;
    }

    // Otherwise, it's an intermediate folder
    // Find or create a folder node with name = first
    let folderNode = currentLevel.find(
        n => n.type === 'folder' && n.name === first
    ) as FolderNode | undefined;

    if (!folderNode) {
        folderNode = {
            name: first,
            type: 'folder',
            path: '', // We’ll fill only if needed
            sha: '',
            children: [],
        };
        currentLevel.push(folderNode);
    }

    // Recurse into that folder node’s children
    insertPath(folderNode.children, rest, item);
}

/**
 * The FileTree component: recursively displays folder/file nodes with collapsible folders
 */
function FileTree({ nodes }: { nodes: (FolderNode|FileNode)[] }) {
    return (
        <ul className="file-tree">
            {nodes.map(node => (
                <FileNodeUI key={`${node.type}-${node.path || node.name}`} node={node} />
            ))}
        </ul>
    );
}

function FileNodeUI({ node }: { node: FolderNode|FileNode }) {
    const [isOpen, setIsOpen] = useState(false);

    if (node.type === 'file') {
        // Simple file line
        return (
            <li className="file-item">
                <span className="file-icon">📄</span> {node.name}
            </li>
        );
    } else {
        // Folder node
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
                            <FileNodeUI key={`${child.type}-${child.path || child.name}`} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }
}

