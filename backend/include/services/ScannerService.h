#ifndef SCANNER_SERVICE_H
#define SCANNER_SERVICE_H

#include <string>
#include <map>
#include <vector>
#include <set>
#include <fstream>
#include <sstream>
#include <filesystem>
#include <regex>
#include <algorithm>
#include <iostream>
#include <memory>
#include <nlohmann/json.hpp>
#include "GitHubService.h"
#include "CodeAnalyzer.h"

namespace fs = std::filesystem;
using json = nlohmann::json;

class ScannerService {
private:
    std::string summaries_path;
    std::string repos_path;
    std::unique_ptr<CodeAnalyzer> code_analyzer_;
    
    // Enhanced logging
    void logInfo(const std::string& message) {
        std::cout << "🔍 [ScannerService] " << message << std::endl;
    }
    
    void logError(const std::string& context, const std::exception& e) {
        std::cerr << "❌ [ScannerService] Error in " << context << ": " << e.what() << std::endl;
    }
    
    void logWarning(const std::string& message) {
        std::cout << "⚠️ [ScannerService] " << message << std::endl;
    }

    // Supported code file extensions
    std::set<std::string> code_extensions = {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h", ".hpp",
        ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".cs", ".html",
        ".css", ".scss", ".json", ".yaml", ".yml", ".md", ".sql", ".sh"
    };

    // Check if file should be skipped based on gitignore patterns
    bool shouldSkipFile(const std::string& file_path, const std::vector<std::string>& patterns) {
        for (const auto& pattern : patterns) {
            if (file_path.find(pattern) != std::string::npos) {
                return true;
            }
        }
        return false;
    }

    // Analyze Python files using regex
    json analyzePythonFile(const std::string& file_path, const std::string& content) {
        json analysis;
        analysis["type"] = "python";
        
        std::vector<std::string> functions;
        std::vector<std::string> classes;
        std::vector<std::string> imports;
        
        // Regex patterns for Python
        std::regex func_pattern(R"(def\s+(\w+)\s*\()");
        std::regex class_pattern(R"(class\s+(\w+))");
        std::regex import_pattern(R"((?:from\s+(\S+)\s+)?import\s+(\S+))");
        
        std::smatch match;
        std::string::const_iterator searchStart(content.cbegin());
        
        // Find all functions
        while (std::regex_search(searchStart, content.cend(), match, func_pattern)) {
            functions.push_back(match[1]);
            searchStart = match.suffix().first;
        }
        
        // Find all classes
        searchStart = content.cbegin();
        while (std::regex_search(searchStart, content.cend(), match, class_pattern)) {
            classes.push_back(match[1]);
            searchStart = match.suffix().first;
        }
        
        // Find all imports
        searchStart = content.cbegin();
        while (std::regex_search(searchStart, content.cend(), match, import_pattern)) {
            if (match[1].matched) {
                imports.push_back(match[1]);
            }
            std::string imp = match[2];
            // Remove 'as' aliases
            size_t as_pos = imp.find(" as ");
            if (as_pos != std::string::npos) {
                imp = imp.substr(0, as_pos);
            }
            imports.push_back(imp);
            searchStart = match.suffix().first;
        }
        
        analysis["functions"] = functions;
        analysis["classes"] = classes;
        analysis["imports"] = imports;
        analysis["lines"] = std::count(content.begin(), content.end(), '\n') + 1;
        
        return analysis;
    }

    // Analyze JavaScript/TypeScript files using regex
    json analyzeJavaScriptFile(const std::string& content) {
        json analysis;
        analysis["type"] = "javascript";
        
        std::vector<std::string> functions;
        std::vector<std::string> classes;
        std::vector<std::string> imports;
        std::vector<std::string> exports;
        
        // Regex patterns for JavaScript/TypeScript
        std::regex func_pattern(R"((?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\())");
        std::regex class_pattern(R"(class\s+(\w+))");
        std::regex import_pattern(R"(import\s+.*?\s+from\s+['"](.+?)['"])");
        std::regex export_pattern(R"(export\s+(?:default\s+)?(?:class|function|const)\s+(\w+))");
        
        std::smatch match;
        std::string::const_iterator searchStart(content.cbegin());
        
        // Find functions
        while (std::regex_search(searchStart, content.cend(), match, func_pattern)) {
            for (size_t i = 1; i < match.size(); ++i) {
                if (match[i].matched) {
                    functions.push_back(match[i]);
                    break;
                }
            }
            searchStart = match.suffix().first;
        }
        
        // Find classes
        searchStart = content.cbegin();
        while (std::regex_search(searchStart, content.cend(), match, class_pattern)) {
            classes.push_back(match[1]);
            searchStart = match.suffix().first;
        }
        
        // Find imports
        searchStart = content.cbegin();
        while (std::regex_search(searchStart, content.cend(), match, import_pattern)) {
            imports.push_back(match[1]);
            searchStart = match.suffix().first;
        }
        
        // Find exports
        searchStart = content.cbegin();
        while (std::regex_search(searchStart, content.cend(), match, export_pattern)) {
            exports.push_back(match[1]);
            searchStart = match.suffix().first;
        }
        
        analysis["functions"] = functions;
        analysis["classes"] = classes;
        analysis["imports"] = imports;
        analysis["exports"] = exports;
        analysis["lines"] = std::count(content.begin(), content.end(), '\n') + 1;
        
        return analysis;
    }

    // Detect the purpose of a file based on name and content
    std::string detectFilePurpose(const std::string& file_path, const json& analysis) {
        std::string filename = fs::path(file_path).filename().string();
        std::transform(filename.begin(), filename.end(), filename.begin(), ::tolower);
        
        // Check for test files
        if (filename.find("test") != std::string::npos || 
            filename.find("spec") != std::string::npos ||
            filename.find(".test.") != std::string::npos ||
            filename.find(".spec.") != std::string::npos) {
            return "Test file - Contains unit tests and test cases";
        }
        
        // Check for configuration files
        if (filename == "config.py" || filename == "settings.py" || 
            filename == "config.js" || filename == "config.ts" ||
            filename == ".env" || filename.find("config") != std::string::npos) {
            return "Configuration file - Stores application settings";
        }
        
        // Check for package initializers
        if (filename == "__init__.py") {
            return "Package initializer - Makes directory a Python package";
        }
        
        // Check for entry points
        if (filename == "main.py" || filename == "app.py" || 
            filename == "index.js" || filename == "server.js" ||
            filename == "index.ts" || filename == "main.cpp") {
            return "Entry point - Main application file";
        }
        
        // Check for models/schemas
        if (filename.find("model") != std::string::npos || 
            filename.find("schema") != std::string::npos) {
            return "Data model - Defines data structures and database schemas";
        }
        
        // Check for services
        if (filename.find("service") != std::string::npos) {
            return "Service layer - Contains business logic";
        }
        
        // Check for controllers/routes
        if (filename.find("controller") != std::string::npos || 
            filename.find("route") != std::string::npos) {
            return "Controller/Router - Handles HTTP requests and routing";
        }
        
        // Check for utilities
        if (filename.find("util") != std::string::npos || 
            filename.find("helper") != std::string::npos) {
            return "Utility file - Helper functions and utilities";
        }
        
        // Check for types/interfaces (TypeScript)
        if (filename.find("type") != std::string::npos || 
            filename.find("interface") != std::string::npos) {
            return "Type definitions - TypeScript types and interfaces";
        }
        
        return "Source file - Contains application code";
    }

    // Generate a summary for a file
    std::string generateFileSummary(const std::string& file_path, const json& analysis) {
        std::string purpose = detectFilePurpose(file_path, analysis);
        std::vector<std::string> lines;
        
        lines.push_back("Purpose: " + purpose);
        
        // Add class information
        if (analysis.contains("classes") && !analysis["classes"].empty()) {
            std::string classes_str = "Defines classes: ";
            int count = 0;
            for (const auto& cls : analysis["classes"]) {
                if (count++ >= 3) break;
                classes_str += cls.get<std::string>() + ", ";
            }
            if (count > 0) {
                classes_str = classes_str.substr(0, classes_str.length() - 2);
                lines.push_back(classes_str);
            }
        }
        
        // Add function count
        if (analysis.contains("functions") && !analysis["functions"].empty()) {
            lines.push_back("Contains " + std::to_string(analysis["functions"].size()) + " function(s)");
        }
        
        // Add import/dependency information
        if (analysis.contains("imports") && !analysis["imports"].empty()) {
            std::string imports_str = "Dependencies: ";
            int count = 0;
            for (const auto& imp : analysis["imports"]) {
                if (count++ >= 5) break;
                imports_str += imp.get<std::string>() + ", ";
            }
            if (count > 0) {
                imports_str = imports_str.substr(0, imports_str.length() - 2);
                lines.push_back(imports_str);
            }
        }
        
        // Add export information for JS/TS
        if (analysis.contains("exports") && !analysis["exports"].empty()) {
            std::string exports_str = "Exports: ";
            int count = 0;
            for (const auto& exp : analysis["exports"]) {
                if (count++ >= 3) break;
                exports_str += exp.get<std::string>() + ", ";
            }
            if (count > 0) {
                exports_str = exports_str.substr(0, exports_str.length() - 2);
                lines.push_back(exports_str);
            }
        }
        
        // Join all lines with separator
        std::string result;
        for (size_t i = 0; i < lines.size(); ++i) {
            result += lines[i];
            if (i < lines.size() - 1) result += " | ";
        }
        
        return result;
    }

    // Save analysis results to file with error handling
    void saveAnalysisResults(const std::string& repo_id, const json& analysis) {
        try {
            std::string summary_file = summaries_path + "/" + repo_id + ".json";
            
            std::ofstream file(summary_file);
            if (!file.is_open()) {
                throw std::runtime_error("Failed to open file for writing: " + summary_file);
            }
            
            file << analysis.dump(2); // Pretty print
            file.close();
            
            logInfo("Analysis results saved to: " + summary_file);
            
        } catch (const std::exception& e) {
            logError("saveAnalysisResults", e);
            throw std::runtime_error("Failed to save analysis results for " + repo_id);
        }
    }

    // Check if repository needs re-scanning
    bool needsRescan(const std::string& repo_id) {
        try {
            std::string summary_file = summaries_path + "/" + repo_id + ".json";
            std::string repo_dir = repos_path + "/" + repo_id;
            
            if (!fs::exists(summary_file)) {
                logInfo("No existing analysis found, scan required for: " + repo_id);
                return true;
            }
            
            if (!fs::exists(repo_dir)) {
                logWarning("Repository directory missing but analysis exists: " + repo_id);
                return true;
            }
            
            // Check if repository has been modified since last analysis
            auto analysis_time = fs::last_write_time(summary_file);
            auto repo_time = fs::last_write_time(repo_dir);
            
            if (repo_time > analysis_time) {
                logInfo("Repository modified since last analysis, rescan required: " + repo_id);
                return true;
            }
            
            logInfo("Using cached analysis for: " + repo_id);
            return false;
            
        } catch (const std::exception& e) {
            logError("needsRescan", e);
            return true; // Default to rescan on error
        }
    }

    // Enhanced scan using CodeAnalyzer for comprehensive analysis
    json enhancedScanRepository(const std::string& repo_path) {
        try {
            logInfo("Starting enhanced scan for: " + repo_path);
            
            // Use CodeAnalyzer for comprehensive analysis
            auto comprehensive_analysis = code_analyzer_->analyzeRepository(fs::path(repo_path).filename().string());
            
            // Convert to compatible format with existing system
            json scan_results;
            scan_results["repo_path"] = repo_path;
            scan_results["total_files"] = comprehensive_analysis["analysis"].value("total_files", 0);
            scan_results["analyzed_files"] = comprehensive_analysis["analysis"].value("total_files", 0);
            
            json file_summaries;
            
            if (comprehensive_analysis.contains("files")) {
                for (const auto& [file_path, file_info] : comprehensive_analysis["files"].items()) {
                    json enhanced_file_info;
                    enhanced_file_info["path"] = file_path;
                    enhanced_file_info["extension"] = fs::path(file_path).extension().string();
                    enhanced_file_info["analysis"] = file_info;
                    
                    // Generate summary using enhanced analysis
                    std::stringstream summary;
                    summary << "Purpose: " << file_info.value("purpose", "Unknown");
                    summary << " | Language: " << file_info.value("language", "Unknown");
                    summary << " | Lines: " << file_info.value("line_count", 0);
                    summary << " | Complexity: " << file_info.value("complexity_score", 0);
                    
                    if (file_info.contains("functions") && !file_info["functions"].empty()) {
                        summary << " | Functions: " << file_info["functions"].size();
                    }
                    
                    if (file_info.contains("classes") && !file_info["classes"].empty()) {
                        summary << " | Classes: " << file_info["classes"].size();
                    }
                    
                    enhanced_file_info["summary"] = summary.str();
                    file_summaries[file_path] = enhanced_file_info;
                }
            }
            
            scan_results["files"] = file_summaries;
            scan_results["enhanced_analysis"] = comprehensive_analysis["analysis"];
            
            logInfo("Enhanced scan completed for: " + repo_path);
            return scan_results;
            
        } catch (const std::exception& e) {
            logError("enhancedScanRepository", e);
            logWarning("Falling back to basic scan due to enhanced scan failure");
            return scanRepository(repo_path); // Fallback to original method
        }
    }

public:
    ScannerService() {
        try {
            const char* summaries = std::getenv("SUMMARIES_PATH");
            const char* repos = std::getenv("REPOS_PATH");
            
            summaries_path = summaries ? summaries : "/app/data/summaries";
            repos_path = repos ? repos : "/app/data/repositories";
            
            // Create directories if they don't exist
            if (!fs::exists(summaries_path)) {
                fs::create_directories(summaries_path);
                logInfo("Created summaries directory: " + summaries_path);
            }
            
            if (!fs::exists(repos_path)) {
                fs::create_directories(repos_path);
                logInfo("Created repositories directory: " + repos_path);
            }
            
            // Initialize CodeAnalyzer
            code_analyzer_ = std::make_unique<CodeAnalyzer>(repos_path);
            
            logInfo("ScannerService initialized successfully");
            logInfo("Summaries path: " + summaries_path);
            logInfo("Repositories path: " + repos_path);
            
        } catch (const std::exception& e) {
            logError("Constructor", e);
            throw;
        }
    }

    // Enhanced scan repository with comprehensive analysis
    json scanRepository(const std::string& repo_path) {
        try {
            logInfo("Starting repository scan: " + repo_path);
            
            if (!fs::exists(repo_path)) {
                throw std::runtime_error("Repository path does not exist: " + repo_path);
            }
            
            std::string repo_id = fs::path(repo_path).filename().string();
            
            // Check if we can use cached results
            if (!needsRescan(repo_id)) {
                logInfo("Using cached analysis for: " + repo_id);
                return getRepositorySummary(repo_id);
            }
            
            // Try enhanced scan first, fallback to basic scan if needed
            json scan_results;
            try {
                scan_results = enhancedScanRepository(repo_path);
            } catch (const std::exception& e) {
                logWarning("Enhanced scan failed, falling back to basic scan: " + std::string(e.what()));
                scan_results = basicScanRepository(repo_path);
            }
            
            // Save results
            saveAnalysisResults(repo_id, scan_results);
            
            logInfo("Scan completed successfully for: " + repo_id);
            logInfo("Total files analyzed: " + std::to_string(scan_results.value("analyzed_files", 0)));
            
            return scan_results;
            
        } catch (const std::exception& e) {
            logError("scanRepository", e);
            throw std::runtime_error("Repository scan failed: " + std::string(e.what()));
        }
    }

    // Original basic scan method (preserved for compatibility)
    json basicScanRepository(const std::string& repo_path) {
        try {
            logInfo("Starting basic scan: " + repo_path);
            
            GitHubService github_service;
            auto gitignore_patterns = github_service.getGitignorePatterns(repo_path);
            
            json scan_results;
            json file_summaries;
            int total_files = 0;
            
            // Recursively iterate through all files
            for (const auto& entry : fs::recursive_directory_iterator(repo_path)) {
                if (!entry.is_regular_file()) continue;
                
                std::string file_path = entry.path().string();
                std::string relative_path = fs::relative(file_path, repo_path).string();
                
                // Skip files matching gitignore patterns
                if (shouldSkipFile(file_path, gitignore_patterns)) continue;
                
                std::string ext = entry.path().extension().string();
                
                // Skip non-code files
                if (code_extensions.find(ext) == code_extensions.end()) continue;
                
                total_files++;
                
                try {
                    // Read file content
                    std::ifstream file(file_path);
                    std::stringstream buffer;
                    buffer << file.rdbuf();
                    std::string content = buffer.str();
                    file.close();
                    
                    // Analyze based on file type
                    json analysis;
                    if (ext == ".py") {
                        analysis = analyzePythonFile(file_path, content);
                    } else if (ext == ".js" || ext == ".jsx" || ext == ".ts" || ext == ".tsx") {
                        analysis = analyzeJavaScriptFile(content);
                    } else {
                        analysis["type"] = "other";
                        analysis["lines"] = std::count(content.begin(), content.end(), '\n') + 1;
                    }
                    
                    // Generate summary
                    std::string summary = generateFileSummary(file_path, analysis);
                    
                    // Store file information
                    json file_info;
                    file_info["path"] = relative_path;
                    file_info["extension"] = ext;
                    file_info["analysis"] = analysis;
                    file_info["summary"] = summary;
                    
                    file_summaries[relative_path] = file_info;
                    
                    logInfo("✓ Analyzed: " + relative_path);
                    
                } catch (const std::exception& e) {
                    logError("basicScanRepository file analysis", e);
                }
            }
            
            // Prepare final results
            scan_results["repo_path"] = repo_path;
            scan_results["total_files"] = total_files;
            scan_results["analyzed_files"] = file_summaries.size();
            scan_results["files"] = file_summaries;
            
            logInfo("Basic scan completed. Analyzed " + std::to_string(file_summaries.size()) + " files");
            
            return scan_results;
            
        } catch (const std::exception& e) {
            logError("basicScanRepository", e);
            throw;
        }
    }

    // Get saved repository summary
    json getRepositorySummary(const std::string& repo_id) {
        try {
            std::string summary_file = summaries_path + "/" + repo_id + ".json";
            
            if (!fs::exists(summary_file)) {
                throw std::runtime_error("Summary not found for repo: " + repo_id);
            }
            
            std::ifstream file(summary_file);
            if (!file.is_open()) {
                throw std::runtime_error("Failed to open summary file: " + summary_file);
            }
            
            json summary;
            file >> summary;
            
            logInfo("Loaded repository summary for: " + repo_id);
            return summary;
            
        } catch (const std::exception& e) {
            logError("getRepositorySummary", e);
            throw;
        }
    }

    // List all scanned repositories
    json listRepositories() {
        try {
            json repos = json::array();
            int count = 0;
            
            for (const auto& entry : fs::directory_iterator(summaries_path)) {
                if (entry.path().extension() == ".json") {
                    std::string repo_id = entry.path().stem().string();
                    repos.push_back(repo_id);
                    count++;
                }
            }
            
            logInfo("Listed " + std::to_string(count) + " repositories");
            return repos;
            
        } catch (const std::exception& e) {
            logError("listRepositories", e);
            throw;
        }
    }

    // New method: Analyze repository architecture
    json analyzeArchitecture(const std::string& repo_id) {
        try {
            logInfo("Starting architecture analysis for: " + repo_id);
            
            auto analysis = code_analyzer_->analyzeArchitecture(repo_id);
            logInfo("Architecture analysis completed for: " + repo_id);
            
            return analysis;
            
        } catch (const std::exception& e) {
            logError("analyzeArchitecture", e);
            throw;
        }
    }

    // New method: Analyze APIs in repository
    json analyzeAPIs(const std::string& repo_id) {
        try {
            logInfo("Starting API analysis for: " + repo_id);
            
            auto analysis = code_analyzer_->analyzeAPIs(repo_id);
            logInfo("API analysis completed for: " + repo_id);
            
            return analysis;
            
        } catch (const std::exception& e) {
            logError("analyzeAPIs", e);
            throw;
        }
    }

    // New method: Generate comprehensive code summary
    json generateCodeSummary(const std::string& repo_id) {
        try {
            logInfo("Generating comprehensive code summary for: " + repo_id);
            
            auto summary = code_analyzer_->generateCodeSummary(repo_id);
            logInfo("Code summary generated for: " + repo_id);
            
            return summary;
            
        } catch (const std::exception& e) {
            logError("generateCodeSummary", e);
            throw;
        }
    }
};

#endif // SCANNER_SERVICE_H