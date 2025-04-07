// fe/src/SignedUp/DocumentPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../global-css/navbar.css";
import "./CSS/DocPage.css";
import { FiFileText, FiFile, FiFolder } from 'react-icons/fi';
import { FaJsSquare, FaCss3Alt, FaHtml5 } from 'react-icons/fa';
import { IoIosImage } from 'react-icons/io';
import { marked } from 'marked';
import ProgressModal from './ProgressModal';  // <--- Import the progress modal

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

  // Access token / repo
  const [token, setToken] = useState('');
  const [repoFullName, setRepoFullName] = useState('');

  // Documentation text we’re editing
  const [docContent, setDocContent] = useState<string>('');
  const [isAutosaved, setIsAutosaved] = useState(false);

  // For Git branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [nestedTree, setNestedTree] = useState<(FolderNode | FileNode)[]>([]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // For showing a loading bar while summarizing
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // On mount, parse the URL params ?repo=?token=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('repo') || '';
    const t = params.get('token') || '';

    setRepoFullName(r);
    setToken(t);

    if (r && t) {
      fetchBranches(r, t);
    }

    // Restore doc content from localStorage
    const savedDocContent = localStorage.getItem('docContent');
    if (savedDocContent) {
      setDocContent(savedDocContent);
    }
  }, [location.search]);

  /**
   * Fetch the branches from GitHub
   */
  async function fetchBranches(repo: string, accessToken: string) {
    try {
      const [owner, repoName] = repo.split('/');
      const url = `https://api.github.com/repos/${owner}/${repoName}/branches`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
      console.error('Error fetching branches:', err);
    }
  }

  /**
   * Fetch the entire file tree for the selected branch
   */
  async function fetchFileTree(repo: string, accessToken: string, commitSha: string) {
    try {
      const [owner, repoName] = repo.split('/');
      const url = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${commitSha}?recursive=1`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error('Could not fetch file tree');
      const data: GitTreeResponse = await resp.json();
      setTreeItems(data.tree);
    } catch (err) {
      console.error('Error fetching file tree:', err);
    }
  }

  // Build nested tree structure
  useEffect(() => {
    if (treeItems.length === 0) {
      setNestedTree([]);
      return;
    }
    const root = buildNestedTree(treeItems);
    setNestedTree(root);
  }, [treeItems]);

  /**
   * Branch dropdown change
   */
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;
    setSelectedBranch(newBranch);

    const br = branches.find(b => b.name === newBranch);
    if (br) {
      fetchFileTree(repoFullName, token, br.commit.sha);
    }
  };

  /**
   * Called when user types in the doc editor
   * We autosave after 1s
   */
  const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDocContent(newValue);
    setIsAutosaved(false);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      localStorage.setItem('docContent', newValue);
      setIsAutosaved(true);
      console.log('Autosaved:', newValue);
    }, 1000);
  };

  /**
   * Example: get the file's SHA from GitHub before committing
   */
  const getFileSha = useCallback(async (path: string) => {
    if (!repoFullName || !token || !selectedBranch) return null;

    const [owner, repoName] = repoFullName.split('/');
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${selectedBranch}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      console.error('Failed to fetch file SHA');
      return null;
    }

    const data = await resp.json();
    return data.sha; // might be undefined if file doesn't exist
  }, [repoFullName, token, selectedBranch]);

  /**
   * Commit the doc content to GitHub as 'DOC_README.md'
   */
  const handleCommitToGithub = useCallback(async () => {
    if (!repoFullName || !token || !selectedBranch) return;

    const path = 'README.md'; // or README.md
    let sha = await getFileSha(path);

    // If sha is null, there's no existing file. That's fine, we do a create.
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
          sha, // can be null if file doesn't exist yet
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
      console.error('Error committing to GitHub:', err);
      alert(`Error committing to GitHub: ${err}`);
    }
  }, [docContent, repoFullName, selectedBranch, token, getFileSha]);

  /**
   * Go back
   */
  const goBack = () => {
    navigate(-1);
  };

  /**
   * Generate user manual by calling /documents/analyze-repository
   * Show the progress modal so the user sees a loading bar
   */
  const handleGenerateUserManual = async () => {
    if (!repoFullName || !token || !selectedBranch) return;
    setIsGenerating(true);
    setIsComplete(false);

    try {
      console.log('Generating user manual...');
      console.log('Token:', token);
      const response = await fetch('http://localhost:5001/documents/analyze-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoFullName, token, selectedBranch }),
      });

      if (!response.ok) {
        console.error('Failed to generate user manual:', response.statusText);
        throw new Error('Failed to generate user manual');
      }

      const data = await response.json();
      console.log('User manual generated:', data);

      // The server might return an object like { userManual: "<string>" }
      // or double-wrapped { userManual: { userManual: "<string>" } }
      let finalText = '';

      if (typeof data.userManual === 'string') {
        // single-layer
        finalText = data.userManual;
      } else if (data.userManual && typeof data.userManual.userManual === 'string') {
        // double-layer
        finalText = data.userManual.userManual;
      } else {
        // fallback: no recognized string
        finalText = JSON.stringify(data, null, 2);
      }

      setDocContent(finalText);
      setIsComplete(true); // cause the progress bar to jump to 100%
    } catch (err) {
      console.error('Error generating user manual:', err);
      alert('Error generating user manual. Check console for details.');
      setIsGenerating(false);
    }
  };

  /**
   * Called when user clicks 'Close' on the progress modal
   */
  const handleCloseModal = () => {
    setIsGenerating(false);
  };

  return (
    <div className="doc-container">
      {/* The loading bar modal, center of screen */}
      <ProgressModal
        isVisible={isGenerating}
        isComplete={isComplete}
        onClose={handleCloseModal}
      />

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
          <button className="btn commit-btn" onClick={handleCommitToGithub}>
            Commit to GitHub
          </button>
          <button className="btn generate-btn" onClick={handleGenerateUserManual}>
            Generate User Manual
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Build a nested tree from the raw Git items
 */
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

/**
 * Render the file/folder tree
 */
function FileTree({ nodes }: { nodes: (FolderNode | FileNode)[] }) {
  // Folders first, then files, alphabetical
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
    return icons[extension as string] || icons.default;
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
