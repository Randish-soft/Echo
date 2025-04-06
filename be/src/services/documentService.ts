import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

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

export const analyzeRepository = async (repoFullName: string, token: string, selectedBranch: string) => {
  const [owner, repoName] = repoFullName.split('/');
  const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${selectedBranch}?recursive=1`;

  console.log('🔍 Fetching repository file tree from GitHub...');
  try {
    const treeResp = await axios.get(treeUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (treeResp.status !== 200) {
      console.error('❌ Failed to fetch file tree:', treeResp.statusText);
      throw new Error('Could not fetch file tree');
    }

    const data: GitTreeResponse = treeResp.data;
    console.log(`✅ Fetched ${data.tree.length} items from the repo tree.`);

    const files = data.tree.filter(item => item.type === 'blob');

    const fileContents = await Promise.all(files.map(async file => {
      const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}?ref=${selectedBranch}`;
      console.log(`📄 Fetching content for file: ${file.path}`);
      try {
        const fileResp = await axios.get(fileUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (fileResp.status !== 200) {
          console.error(`❌ Failed to fetch content for ${file.path}: ${fileResp.statusText}`);
          throw new Error(`Could not fetch file content for ${file.path}`);
        }

        const fileData = fileResp.data;
        return {
          path: file.path,
          content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
        };
      } catch (error) {
        console.error(`Error fetching file content for ${file.path}:`, error);
        throw error;
      }
    }));

    console.log('✅ All file contents fetched and decoded.');

    const prompt = generateUserManual(fileContents);

    try {
      const hfResponse = await axios.post(
        'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (hfResponse.status !== 200) {
        console.error('❌ Failed to get response from Hugging Face:', hfResponse.statusText);
        throw new Error('Hugging Face inference failed');
      }

      console.log('✅ Hugging Face model returned a response.');
      return hfResponse.data;
    } catch (error) {
      console.error('Error getting response from Hugging Face:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
};

export const generateUserManual = (files: { path: string, content: string }[]) => {
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /venv/,
    /\.dockerfile/i,
    /\.gitignore/i,
    /package(-lock)?\.json/i,
    /\.env/i,
    /dist/i,
    /.*\.md$/i
  ];

  const filteredFiles = files.filter(file =>
    !skipPatterns.some(pattern => pattern.test(file.path))
  );

  let prompt = `You are an expert software engineer. Based on the following codebase, generate a clean, concise user manual describing the core functionality, structure, and how a developer might use or contribute to it:\n\n`;

  filteredFiles.forEach(file => {
    prompt += `### File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
  });

  return prompt;
};
