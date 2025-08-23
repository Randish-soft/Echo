export const DOCUMENTATION_TYPES = {
  EXTERNAL: 'external',
  INTERNAL: 'internal',
  API: 'api',
  USER_GUIDE: 'user_guide',
} as const

export const DOCUMENTATION_TYPE_LABELS = {
  [DOCUMENTATION_TYPES.EXTERNAL]: 'External Documentation',
  [DOCUMENTATION_TYPES.INTERNAL]: 'Internal Documentation',
  [DOCUMENTATION_TYPES.API]: 'API Documentation',
  [DOCUMENTATION_TYPES.USER_GUIDE]: 'User Guide',
}

export const PROCESSING_STATUSES = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const PROCESSING_STATUS_LABELS = {
  [PROCESSING_STATUSES.PENDING]: 'Pending',
  [PROCESSING_STATUSES.ANALYZING]: 'Analyzing Code',
  [PROCESSING_STATUSES.GENERATING]: 'Generating Documentation',
  [PROCESSING_STATUSES.COMPLETED]: 'Completed',
  [PROCESSING_STATUSES.FAILED]: 'Failed',
}

export const SUPPORTED_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'HTML',
  'CSS',
  'Shell',
  'Dockerfile',
] as const

export const FILE_EXTENSIONS = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.cs': 'C#',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'CSS',
  '.sass': 'CSS',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  'Dockerfile': 'Dockerfile',
} as const

export const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'target',
  '__pycache__',
  '.venv',
  'venv',
  '.env',
  'coverage',
  '.nyc_output',
  'logs',
]

export const EXCLUDED_FILES = [
  '.gitignore',
  '.eslintrc',
  '.prettierrc',
  'package-lock.json',
  'yarn.lock',
  '.DS_Store',
  'Thumbs.db',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES_PER_REPO = 1000

export const GITHUB_SCOPES = [
  'repo',
  'read:user',
  'user:email',
]

export const API_ENDPOINTS = {
  AUTH: {
    GITHUB: '/api/auth/github',
    CALLBACK: '/api/auth/callback',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  REPOSITORIES: {
    LIST: '/api/repositories',
    SYNC: '/api/repositories/sync',
    DETAIL: (id: string) => `/api/repositories/${id}`,
    ANALYZE: (id: string) => `/api/repositories/${id}/analyze`,
  },
  DOCUMENTATION: {
    GENERATE: '/api/documentation/generate',
    LIST: '/api/documentation',
    DETAIL: (id: string) => `/api/documentation/${id}`,
    DOWNLOAD: (id: string) => `/api/documentation/${id}/download`,
    DELETE: (id: string) => `/api/documentation/${id}`,
  },
  USER: {
    PROFILE: '/api/user/profile',
    SETTINGS: '/api/user/settings',
  },
} as const

export const TOAST_DURATION = 5000

export const POLLING_INTERVALS = {
  DOCUMENTATION_STATUS: 2000,
  REPOSITORY_SYNC: 5000,
} as const

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  REPOSITORY: (id: string) => `/repository/${id}`,
  DOCUMENTATION: (id: string) => `/documentation/${id}`,
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const
