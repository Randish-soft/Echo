/**
 * Analysis Service
 * Handles code analysis and documentation generation logic
 */

import GitHubService from './githubService';

class AnalysisService {
  constructor(githubToken) {
    this.githubService = new GitHubService(githubToken);
    this.supportedExtensions = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.kt': 'kotlin',
      '.swift': 'swift',
      '.scala': 'scala',
      '.r': 'r',
      '.m': 'objectivec',
      '.sh': 'shell',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.json': 'json',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.md': 'markdown',
      '.sql': 'sql',
      '.dockerfile': 'dockerfile'
    };
    
    // Files to skip during analysis
    this.skipPatterns = [
      /node_modules/,
      /\.git/,
      /venv/,
      /env/,
      /\.env/,
      /dist/,
      /build/,
      /target/,
      /bin/,
      /obj/,
      /\.min\./,
      /\.test\./,
      /\.spec\./,
      /coverage/,
      /\.nyc_output/,
      /\.pytest_cache/,
      /__pycache__/
    ];
  }

  /**
   * Step 1: Fetch and clone repository structure
   */
  async fetchRepositoryStructure(owner, repo) {
    try {
      const [repoInfo, tree, languages, readme] = await Promise.all([
        this.githubService.getRepository(owner, repo),
        this.githubService.getRepositoryTree(owner, repo),
        this.githubService.getRepositoryLanguages(owner, repo),
        this.githubService.getRepositoryReadme(owner, repo).catch(() => null)
      ]);

      return {
        repository: repoInfo,
        fileTree: tree,
        languages,
        readme,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching repository structure:', error);
      throw error;
    }
  }

  /**
   * Step 2: Filter and categorize files
   */
  categorizeFiles(fileTree) {
    const categories = {
      source: [],
      config: [],
      documentation: [],
      tests: [],
      assets: [],
      other: []
    };

    const configFiles = [
      'package.json', 'package-lock.json', 'yarn.lock',
      'requirements.txt', 'Pipfile', 'setup.py',
      'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
      'Dockerfile', 'docker-compose.yml',
      '.gitignore', '.eslintrc', '.prettierrc',
      'tsconfig.json', 'webpack.config.js',
      'tailwind.config.js', 'next.config.js'
    ];

    const docFiles = [
      'README.md', 'CHANGELOG.md', 'LICENSE',
      'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'
    ];

    fileTree.tree?.forEach(file => {
      if (file.type !== 'blob') return;
      
      // Skip unwanted files/directories
      if (this.skipPatterns.some(pattern => pattern.test(file.path))) {
        return;
      }

      const fileName = file.path.split('/').pop();
      const extension = this.getFileExtension(file.path);
      const language = this.supportedExtensions[extension];

      if (configFiles.includes(fileName)) {
        categories.config.push({ ...file, language: this.getLanguageByFileName(fileName) });
      } else if (docFiles.includes(fileName) || extension === '.md') {
        categories.documentation.push({ ...file, language: 'markdown' });
      } else if (file.path.includes('test') || file.path.includes('spec')) {
        categories.tests.push({ ...file, language });
      } else if (language) {
        categories.source.push({ ...file, language });
      } else if (['.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(extension)) {
        categories.assets.push({ ...file, type: 'image' });
      } else {
        categories.other.push({ ...file, language: 'text' });
      }
    });

    return categories;
  }

  /**
   * Step 3: Fragment large files into manageable chunks
   */
  fragmentContent(content, maxTokens = 3000) {
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    
    if (content.length <= maxChars) {
      return [content];
    }

    const chunks = [];
    const lines = content.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
      if ((currentChunk + line).length > maxChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Step 4: Analyze code chunks and extract metadata
   */
  analyzeChunk(content, filePath, language) {
    const analysis = {
      filePath,
      language,
      lineCount: content.split('\n').length,
      characterCount: content.length,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      comments: [],
      complexity: 'low',
      purpose: '',
      dependencies: []
    };

    // Language-specific analysis
    switch (language) {
      case 'javascript':
      case 'typescript':
        this.analyzeJavaScript(content, analysis);
        break;
      case 'python':
        this.analyzePython(content, analysis);
        break;
      case 'java':
        this.analyzeJava(content, analysis);
        break;
      default:
        this.analyzeGeneric(content, analysis);
    }

    return analysis;
  }

  /**
   * JavaScript/TypeScript specific analysis
   */
  analyzeJavaScript(content, analysis) {
    // Extract functions
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2] || match[3];
      if (functionName) {
        analysis.functions.push(functionName);
      }
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }

    // Extract imports
    const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1]);
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:class\s+(\w+)|function\s+(\w+)|const\s+(\w+))/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportName = match[1] || match[2] || match[3];
      if (exportName) {
        analysis.exports.push(exportName);
      }
    }
  }

  /**
   * Python specific analysis
   */
  analyzePython(content, analysis) {
    // Extract functions
    const functionRegex = /def\s+(\w+)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }

    // Extract imports
    const importRegex = /(?:from\s+(\w+)\s+)?import\s+([\w\s,]+)/g;
    while ((match = importRegex.exec(content)) !== null) {
      const module = match[1] || match[2].split(',')[0].trim();
      analysis.imports.push(module);
    }
  }

  /**
   * Generic analysis for other languages
   */
  analyzeGeneric(content, analysis) {
    // Count basic patterns
    analysis.functions = (content.match(/function|def|func|method/gi) || []).length;
    analysis.classes = (content.match(/class/gi) || []).length;
    
    // Extract comments
    const commentRegex = /(\/\*[\s\S]*?\*\/|\/\/.*$|#.*$|"""[\s\S]*?""")/gm;
    let match;
    while ((match = commentRegex.exec(content)) !== null) {
      analysis.comments.push(match[1].trim());
    }
  }

  /**
   * Step 5: Generate analysis summary
   */
  generateAnalysisSummary(categorizedFiles, analyses) {
    const summary = {
      repository: {
        totalFiles: 0,
        totalLines: 0,
        languages: {},
        structure: {}
      },
      codebase: {
        mainLanguage: '',
        frameworks: [],
        dependencies: [],
        architecture: 'unknown',
        patterns: []
      },
      documentation: {
        existing: [],
        missing: [],
        quality: 'unknown'
      },
      recommendations: []
    };

    // Calculate statistics
    Object.entries(categorizedFiles).forEach(([category, files]) => {
      summary.repository.totalFiles += files.length;
      summary.repository.structure[category] = files.length;

      files.forEach(file => {
        const analysis = analyses.find(a => a.filePath === file.path);
        if (analysis) {
          summary.repository.totalLines += analysis.lineCount;
          summary.repository.languages[analysis.language] = 
            (summary.repository.languages[analysis.language] || 0) + 1;
        }
      });
    });

    // Determine main language
    const languages = Object.entries(summary.repository.languages);
    if (languages.length > 0) {
      summary.codebase.mainLanguage = languages.reduce((a, b) => 
        summary.repository.languages[a[0]] > summary.repository.languages[b[0]] ? a : b
      )[0];
    }

    // Detect frameworks and patterns
    this.detectFrameworks(analyses, summary);
    this.generateRecommendations(categorizedFiles, summary);

    return summary;
  }

  /**
   * Detect frameworks and architectural patterns
   */
  detectFrameworks(analyses, summary) {
    const frameworkPatterns = {
      react: ['react', 'jsx', 'useState', 'useEffect'],
      vue: ['vue', '@vue', 'composition-api'],
      angular: ['@angular', 'ng-', 'angular'],
      express: ['express', 'app.get', 'app.post'],
      django: ['django', 'models.Model', 'views.py'],
      flask: ['flask', 'app.route', 'Flask('],
      nextjs: ['next', 'getServerSideProps', 'getStaticProps'],
      tailwind: ['tailwind', 'tw-', 'class="'],
      docker: ['FROM', 'RUN', 'COPY', 'dockerfile']
    };

    analyses.forEach(analysis => {
      const content = analysis.content || '';
      Object.entries(frameworkPatterns).forEach(([framework, patterns]) => {
        if (patterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()))) {
          if (!summary.codebase.frameworks.includes(framework)) {
            summary.codebase.frameworks.push(framework);
          }
        }
      });
    });
  }

  /**
   * Generate documentation recommendations
   */
  generateRecommendations(categorizedFiles, summary) {
    // Check for missing documentation
    if (categorizedFiles.documentation.length === 0) {
      summary.recommendations.push('Add basic documentation (README.md)');
    }

    if (!categorizedFiles.documentation.find(f => f.path.includes('CHANGELOG'))) {
      summary.recommendations.push('Create a CHANGELOG.md file');
    }

    if (!categorizedFiles.documentation.find(f => f.path.includes('CONTRIBUTING'))) {
      summary.recommendations.push('Add contribution guidelines');
    }

    // API documentation recommendations
    if (summary.codebase.frameworks.includes('express') || 
        summary.codebase.frameworks.includes('django') || 
        summary.codebase.frameworks.includes('flask')) {
      summary.recommendations.push('Generate API documentation');
    }

    // Architecture documentation
    if (summary.repository.totalFiles > 50) {
      summary.recommendations.push('Create architecture documentation');
    }
  }

  /**
   * Utility methods
   */
  getFileExtension(filePath) {
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
  }

  getLanguageByFileName(fileName) {
    const languageMap = {
      'package.json': 'json',
      'Dockerfile': 'dockerfile',
      'docker-compose.yml': 'yaml',
      'requirements.txt': 'text',
      'Pipfile': 'toml',
      'Cargo.toml': 'toml',
      'go.mod': 'text',
      'pom.xml': 'xml'
    };
    return languageMap[fileName] || 'text';
  }

  /**
   * Main analysis pipeline
   */
  async analyzeRepository(owner, repo, progressCallback) {
    try {
      // Step 1: Fetch repository structure
      if (progressCallback) progressCallback('Fetching repository structure', 10);
      const structure = await this.fetchRepositoryStructure(owner, repo);

      // Step 2: Categorize files
      if (progressCallback) progressCallback('Categorizing files', 25);
      const categorizedFiles = this.categorizeFiles(structure.fileTree);

      // Step 3: Analyze source files (limited to prevent API overuse)
      if (progressCallback) progressCallback('Analyzing code files', 50);
      const analyses = [];
      const filesToAnalyze = [
        ...categorizedFiles.source.slice(0, 20), // Limit to first 20 source files
        ...categorizedFiles.config.slice(0, 10)  // Include config files
      ];

      for (const file of filesToAnalyze) {
        try {
          const content = await this.githubService.getFileContent(owner, repo, file.path);
          const chunks = typeof content === 'string' ? this.fragmentContent(content) : [JSON.stringify(content)];
          
          chunks.forEach((chunk, index) => {
            const analysis = this.analyzeChunk(chunk, `${file.path}${chunks.length > 1 ? `#${index}` : ''}`, file.language);
            analysis.content = chunk; // Store for framework detection
            analyses.push(analysis);
          });
        } catch (error) {
          console.warn(`Failed to analyze file ${file.path}:`, error);
        }
      }

      // Step 4: Generate comprehensive summary
      if (progressCallback) progressCallback('Generating analysis summary', 80);
      const summary = this.generateAnalysisSummary(categorizedFiles, analyses);

      if (progressCallback) progressCallback('Analysis complete', 100);

      return {
        structure,
        categorizedFiles,
        analyses: analyses.map(a => ({ ...a, content: undefined })), // Remove content from response
        summary,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Repository analysis failed:', error);
      throw error;
    }
  }
}

export default AnalysisService;