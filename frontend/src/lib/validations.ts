export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  
  if (!email) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateGitHubUrl(url: string): ValidationResult {
  const errors: string[] = []
  
  if (!url) {
    errors.push('GitHub URL is required')
  } else if (!/^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(url)) {
    errors.push('Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateRepositoryName(name: string): ValidationResult {
  const errors: string[] = []
  
  if (!name) {
    errors.push('Repository name is required')
  } else if (name.length < 1 || name.length > 100) {
    errors.push('Repository name must be between 1 and 100 characters')
  } else if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    errors.push('Repository name can only contain letters, numbers, dots, hyphens, and underscores')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Password is required')
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = []
  
  if (!fileName) {
    errors.push('File name is required')
  } else if (fileName.length > 255) {
    errors.push('File name is too long (maximum 255 characters)')
  } else if (/[<>:"/\\|?*]/.test(fileName)) {
    errors.push('File name contains invalid characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateFileSize(file: File, maxSizeInMB: number = 10): ValidationResult {
  const errors: string[] = []
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  
  if (file.size > maxSizeInBytes) {
    errors.push(`File size must be less than ${maxSizeInMB}MB`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  const errors: string[] = []
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateDocumentationTitle(title: string): ValidationResult {
  const errors: string[] = []
  
  if (!title) {
    errors.push('Documentation title is required')
  } else if (title.length < 3) {
    errors.push('Title must be at least 3 characters long')
  } else if (title.length > 100) {
    errors.push('Title must be less than 100 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateDocumentationDescription(description: string): ValidationResult {
  const errors: string[] = []
  
  if (description && description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateForm(data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): ValidationResult {
  const allErrors: string[] = []
  
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field])
    if (!result.isValid) {
      allErrors.push(...result.errors.map(error => `${field}: ${error}`))
    }
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}
