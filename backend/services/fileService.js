const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const JSZip = require('jszip');

class FileService {
    constructor() {
        this.tempDir = process.env.TEMP_DIR || './temp';
        this.analysisDir = process.env.ANALYSIS_DIR || './analysis';
        this.docsDir = process.env.DOCS_DIR || './generated_docs';
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
            await fs.mkdir(this.analysisDir, { recursive: true });
            await fs.mkdir(this.docsDir, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error creating directories:', error);
            return false;
        }
    }

    async saveFile(content, fileName, directory = this.tempDir) {
        try {
            await fs.mkdir(directory, { recursive: true });
            const filePath = path.join(directory, fileName);
            await fs.writeFile(filePath, content, 'utf-8');
            
            const stats = await fs.stat(filePath);
            
            return {
                success: true,
                filePath: filePath,
                fileName: fileName,
                size: stats.size,
                createdAt: stats.birthtime
            };
        } catch (error) {
            console.error('Error saving file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async readFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);
            
            return {
                success: true,
                content: content,
                size: stats.size,
                modifiedAt: stats.mtime,
                createdAt: stats.birthtime
            };
        } catch (error) {
            console.error('Error reading file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listFiles(directory, extension = null) {
        try {
            const files = await fs.readdir(directory);
            let filteredFiles = files;
            
            if (extension) {
                filteredFiles = files.filter(file => 
                    path.extname(file).toLowerCase() === extension.toLowerCase()
                );
            }
            
            const fileDetails = [];
            
            for (const file of filteredFiles) {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile()) {
                    fileDetails.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        extension: path.extname(file),
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime
                    });
                }
            }
            
            return {
                success: true,
                files: fileDetails.sort((a, b) => b.modifiedAt - a.modifiedAt)
            };
        } catch (error) {
            console.error('Error listing files:', error);
            return {
                success: false,
                error: error.message,
                files: []
            };
        }
    }

    async createZipArchive(files, archiveName) {
        try {
            const zip = new JSZip();
            
            for (const file of files) {
                if (typeof file === 'string') {
                    const content = await fs.readFile(file, 'utf-8');
                    const fileName = path.basename(file);
                    zip.file(fileName, content);
                } else if (file.path && file.name) {
                    const content = await fs.readFile(file.path, 'utf-8');
                    zip.file(file.name, content);
                } else if (file.content && file.name) {
                    zip.file(file.name, file.content);
                }
            }
            
            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
            const zipPath = path.join(this.tempDir, `${archiveName}.zip`);
            
            await fs.writeFile(zipPath, zipBuffer);
            
            return {
                success: true,
                zipPath: zipPath,
                zipName: `${archiveName}.zip`,
                size: zipBuffer.length
            };
        } catch (error) {
            console.error('Error creating zip archive:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async extractZipArchive(zipPath, extractDir) {
        try {
            const zipBuffer = await fs.readFile(zipPath);
            const zip = await JSZip.loadAsync(zipBuffer);
            
            const extractedFiles = [];
            
            for (const fileName in zip.files) {
                const file = zip.files[fileName];
                
                if (!file.dir) {
                    const content = await file.async('string');
                    const filePath = path.join(extractDir, fileName);
                    
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, content);
                    
                    extractedFiles.push({
                        name: fileName,
                        path: filePath,
                        size: content.length
                    });
                }
            }
            
            return {
                success: true,
                extractedFiles: extractedFiles,
                extractDir: extractDir
            };
        } catch (error) {
            console.error('Error extracting zip archive:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async moveFile(sourcePath, targetPath) {
        try {
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.rename(sourcePath, targetPath);
            
            return {
                success: true,
                newPath: targetPath
            };
        } catch (error) {
            console.error('Error moving file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async copyFile(sourcePath, targetPath) {
        try {
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.copyFile(sourcePath, targetPath);
            
            const stats = await fs.stat(targetPath);
            
            return {
                success: true,
                newPath: targetPath,
                size: stats.size
            };
        } catch (error) {
            console.error('Error copying file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            
            return {
                success: true,
                stats: {
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    lines: content.split('\n').length,
                    words: content.split(/\s+/).length,
                    characters: content.length
                }
            };
        } catch (error) {
            console.error('Error getting file stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cleanupTempFiles(olderThanHours = 24) {
        try {
            const files = await this.listFiles(this.tempDir);
            
            if (!files.success) {
                return files;
            }
            
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);
            
            const filesToDelete = files.files.filter(file => 
                file.createdAt < cutoffTime
            );
            
            const deleteResults = [];
            
            for (const file of filesToDelete) {
                const result = await this.deleteFile(file.path);
                deleteResults.push({
                    file: file.name,
                    success: result.success,
                    error: result.error
                });
            }
            
            return {
                success: true,
                deletedCount: filesToDelete.length,
                results: deleteResults
            };
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getDirSize(directory) {
        try {
            const files = await this.listFiles(directory);
            
            if (!files.success) {
                return { success: false, error: files.error };
            }
            
            const totalSize = files.files.reduce((sum, file) => sum + file.size, 0);
            
            return {
                success: true,
                totalSize: totalSize,
                fileCount: files.files.length,
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Error getting directory size:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    generateUniqueFileName(baseName, extension = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueId = uuidv4().split('-')[0];
        
        if (extension && !extension.startsWith('.')) {
            extension = '.' + extension;
        }
        
        return `${baseName}_${timestamp}_${uniqueId}${extension}`;
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    getFileExtension(fileName) {
        return path.extname(fileName).toLowerCase();
    }

    getFileNameWithoutExtension(fileName) {
        return path.basename(fileName, path.extname(fileName));
    }
}

module.exports = FileService;