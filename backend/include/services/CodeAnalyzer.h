#ifndef CODE_ANALYZER_H
#define CODE_ANALYZER_H

#include <string>
#include <map>
#include <vector>
#include <fstream>
#include <sstream>
#include <filesystem>
#include <algorithm>
#include <regex>
#include <iostream>
#include <nlohmann/json.hpp>

namespace fs = std::filesystem;
using json = nlohmann::json;

// File analysis structure
struct CodeFile {
    std::string path;
    std::string language;
    std::string purpose;
    std::vector<std::string> functions;
    std::vector<std::string> classes;
    std::vector<std::string> dependencies;
    std::vector<std::string> imports;
    int complexity_score;
    int line_count;
    std::string summary;
    
    CodeFile() : complexity_score(0), line_count(0) {}
};

// Project structure analysis
struct ProjectStructure {
    std::string main_language;
    std::vector<std::string> entry_points;
    std::map<std::string, std::vector<CodeFile>> modules;
    std::vector<std::string> build_tools;
    std::vector<std::string> dependencies;
    std::vector<std::string> frameworks;
    std::string architecture_pattern;
    int total_files;
    int total_lines;
    
    ProjectStructure() : total_files(0), total_lines(0) {}
};

// API endpoint structure
struct APIEndpoint {
    std::string path;
    std::string method;
    std::string description;
    std::vector<std::string> parameters;
    std::string return_type;
    std::string file_location;
    
    APIEndpoint() : method("GET") {}
};

class CodeAnalyzer {
private:
    std::string repos_path_;
    
    // Enhanced logging
    void logInfo(const std::string& message) {
        std::cout << "🔍 [CodeAnalyzer] " << message << std::endl;
    }
    
    void logError(const std::string& context, const std::exception& e) {
        std::cerr << "❌ [CodeAnalyzer] Error in " << context << ": " << e.what() << std::endl;
    }
    
    void logWarning(const std::string& message) {
        std::cout << "⚠️ [CodeAnalyzer] " << message << std::endl;
    }
    
    void logDebug(const std::string& message) {
        std::cout << "🐛 [CodeAnalyzer] " << message << std::endl;
    }

    // File type detection with comprehensive language support
    std::string detectLanguage(const std::string& file_path) {
        try {
            std::string extension = fs::path(file_path).extension().string();
            std::transform(extension.begin(), extension.end(), extension.begin(), ::tolower);
            
            std::map<std::string, std::string> language_map = {
                {".py", "Python"},
                {".js", "JavaScript"},
                {".jsx", "JavaScript React"},
                {".ts", "TypeScript"},
                {".tsx", "TypeScript React"},
                {".java", "Java"},
                {".cpp", "C++"},
                {".cc", "C++"},
                {".cxx", "C++"},
                {".c", "C"},
                {".h", "C/C++ Header"},
                {".hpp", "C++ Header"},
                {".cs", "C#"},
                {".go", "Go"},
                {".rs", "Rust"},
                {".php", "PHP"},
                {".rb", "Ruby"},
                {".swift", "Swift"},
                {".kt", "Kotlin"},
                {".scala", "Scala"},
                {".m", "Objective-C"},
                {".mm", "Objective-C++"},
                {".r", "R"},
                {".pl", "Perl"},
                {".pm", "Perl"},
                {".lua", "Lua"},
                {".sql", "SQL"},
                {".html", "HTML"},
                {".htm", "HTML"},
                {".css", "CSS"},
                {".scss", "SCSS"},
                {".sass", "SASS"},
                {".less", "LESS"},
                {".xml", "XML"},
                {".json", "JSON"},
                {".yaml", "YAML"},
                {".yml", "YAML"},
                {".toml", "TOML"},
                {".ini", "INI"},
                {".cfg", "Configuration"},
                {".conf", "Configuration"},
                {".sh", "Shell Script"},
                {".bash", "Bash Script"},
                {".zsh", "Zsh Script"},
                {".fish", "Fish Script"},
                {".ps1", "PowerShell"},
                {".bat", "Batch File"},
                {".cmd", "Command File"},
                {".dockerfile", "Dockerfile"},
                {".md", "Markdown"},
                {".txt", "Text"},
                {".log", "Log File"}
            };
            
            if (language_map.find(extension) != language_map.end()) {
                return language_map[extension];
            }
            
            // Special cases for files without extensions
            std::string filename = fs::path(file_path).filename().string();
            std::transform(filename.begin(), filename.end(), filename.begin(), ::tolower);
            
            if (filename == "dockerfile") return "Dockerfile";
            if (filename == "makefile") return "Makefile";
            if (filename == "cmakelists.txt") return "CMake";
            if (filename == "package.json") return "Node.js Configuration";
            if (filename == "requirements.txt") return "Python Dependencies";
            if (filename == "pom.xml") return "Maven Configuration";
            if (filename == "build.gradle") return "Gradle Configuration";
            if (filename == "cargo.toml") return "Rust Configuration";
            if (filename == "go.mod") return "Go Modules";
            
            return "Unknown";
            
        } catch (const std::exception& e) {
            logError("detectLanguage", e);
            return "Unknown";
        }
    }

    // Count lines in file with error handling
    int countLines(const std::string& file_path) {
        try {
            std::ifstream file(file_path);
            if (!file.is_open()) {
                logWarning("Could not open file for line counting: " + file_path);
                return 0;
            }
            
            int line_count = 0;
            std::string line;
            while (std::getline(file, line)) {
                line_count++;
            }
            
            return line_count;
            
        } catch (const std::exception& e) {
            logError("countLines", e);
            return 0;
        }
    }

    // Extract functions from code files (language-specific)
    std::vector<std::string> extractFunctions(const std::string& file_path, const std::string& language) {
        std::vector<std::string> functions;
        
        try {
            std::ifstream file(file_path);
            if (!file.is_open()) {
                return functions;
            }
            
            std::string line;
            std::regex function_pattern;
            
            // Language-specific function patterns
            if (language == "Python") {
                function_pattern = std::regex(R"(def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\()");
            } else if (language == "JavaScript" || language == "TypeScript") {
                function_pattern = std::regex(R"((?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)\s*=>|let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)\s*=>))");
            } else if (language == "Java") {
                function_pattern = std::regex(R"((?:public|private|protected)\s+(?:static\s+)?(?:[a-zA-Z_][a-zA-Z0-9_<>\\[\\]]*\\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\())");
            } else if (language == "C++" || language == "C") {
                function_pattern = std::regex(R"((?:[a-zA-Z_][a-zA-Z0-9_]*\\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\())");
            } else {
                // Generic pattern for other languages
                function_pattern = std::regex(R"(function\s+([a-zA-Z_][a-zA-Z0-9_]*)|def\s+([a-zA-Z_][a-zA-Z0-9_]*)|fn\s+([a-zA-Z_][a-zA-Z0-9_]*))");
            }
            
            while (std::getline(file, line)) {
                std::smatch matches;
                if (std::regex_search(line, matches, function_pattern)) {
                    for (size_t i = 1; i < matches.size(); ++i) {
                        if (matches[i].matched && !matches[i].str().empty()) {
                            functions.push_back(matches[i].str());
                            break;
                        }
                    }
                }
            }
            
            logDebug("Extracted " + std::to_string(functions.size()) + " functions from " + file_path);
            
        } catch (const std::exception& e) {
            logError("extractFunctions", e);
        }
        
        return functions;
    }

    // Extract classes from code files
    std::vector<std::string> extractClasses(const std::string& file_path, const std::string& language) {
        std::vector<std::string> classes;
        
        try {
            std::ifstream file(file_path);
            if (!file.is_open()) {
                return classes;
            }
            
            std::string line;
            std::regex class_pattern;
            
            if (language == "Python") {
                class_pattern = std::regex(R"(class\s+([a-zA-Z_][a-zA-Z0-9_]*))");
            } else if (language == "Java" || language == "C++" || language == "C#") {
                class_pattern = std::regex(R"(class\s+([a-zA-Z_][a-zA-Z0-9_]*))");
            } else if (language == "JavaScript" || language == "TypeScript") {
                class_pattern = std::regex(R"(class\s+([a-zA-Z_][a-zA-Z0-9_]*))");
            } else {
                class_pattern = std::regex(R"(class\s+([a-zA-Z_][a-zA-Z0-9_]*))");
            }
            
            while (std::getline(file, line)) {
                std::smatch matches;
                if (std::regex_search(line, matches, class_pattern)) {
                    if (matches.size() > 1 && !matches[1].str().empty()) {
                        classes.push_back(matches[1].str());
                    }
                }
            }
            
            logDebug("Extracted " + std::to_string(classes.size()) + " classes from " + file_path);
            
        } catch (const std::exception& e) {
            logError("extractClasses", e);
        }
        
        return classes;
    }

    // Extract imports/dependencies
    std::vector<std::string> extractImports(const std::string& file_path, const std::string& language) {
        std::vector<std::string> imports;
        
        try {
            std::ifstream file(file_path);
            if (!file.is_open()) {
                return imports;
            }
            
            std::string line;
            std::regex import_pattern;
            
            if (language == "Python") {
                import_pattern = std::regex(R"((?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_.]*))");
            } else if (language == "JavaScript" || language == "TypeScript") {
                import_pattern = std::regex(R"((?:import|require)\s*(?:\\([^)]+\\)|['\"]([^'\"]+)['\"]))");
            } else if (language == "Java") {
                import_pattern = std::regex(R"(import\s+([a-zA-Z_][a-zA-Z0-9_.]*);)");
            } else if (language == "C++" || language == "C") {
                import_pattern = std::regex(R"(#include\s*(?:<([^>]+)>|"([^"]+)"))");
            }
            
            while (std::getline(file, line)) {
                std::smatch matches;
                if (std::regex_search(line, matches, import_pattern)) {
                    for (size_t i = 1; i < matches.size(); ++i) {
                        if (matches[i].matched && !matches[i].str().empty()) {
                            imports.push_back(matches[i].str());
                        }
                    }
                }
            }
            
        } catch (const std::exception& e) {
            logError("extractImports", e);
        }
        
        return imports;
    }

    // Calculate file complexity (simplified)
    int calculateComplexity(const CodeFile& file) {
        int complexity = 0;
        
        // Base complexity on number of functions and classes
        complexity += file.functions.size() * 2;
        complexity += file.classes.size() * 3;
        
        // Adjust based on line count
        if (file.line_count > 500) complexity += 5;
        else if (file.line_count > 200) complexity += 3;
        else if (file.line_count > 100) complexity += 1;
        
        return std::min(complexity, 10); // Cap at 10
    }

    // Analyze individual file
    CodeFile analyzeFile(const std::string& file_path) {
        CodeFile file;
        
        try {
            file.path = file_path;
            file.language = detectLanguage(file_path);
            file.line_count = countLines(file_path);
            
            // Skip analysis for non-code files
            if (file.language == "Unknown" || 
                file.language == "Markdown" || 
                file.language == "Text" ||
                file.language == "Log File" ||
                file.language == "Configuration") {
                file.purpose = "Documentation/Configuration";
                return file;
            }
            
            // Extract code elements
            file.functions = extractFunctions(file_path, file.language);
            file.classes = extractClasses(file_path, file.language);
            file.imports = extractImports(file_path, file.language);
            file.complexity_score = calculateComplexity(file);
            
            // Determine file purpose based on content and location
            file.purpose = determineFilePurpose(file);
            
            logDebug("Analyzed file: " + file_path + " (" + file.language + ")");
            
        } catch (const std::exception& e) {
            logError("analyzeFile", e);
            file.purpose = "Error during analysis";
        }
        
        return file;
    }

    // Determine file purpose based on various factors
    std::string determineFilePurpose(const CodeFile& file) {
        std::string filename = fs::path(file.path).filename().string();
        std::transform(filename.begin(), filename.end(), filename.begin(), ::tolower);
        
        // Check filename patterns
        if (filename.find("test") != std::string::npos || filename.find("spec") != std::string::npos) {
            return "Testing";
        }
        if (filename.find("model") != std::string::npos || filename.find("entity") != std::string::npos) {
            return "Data Model";
        }
        if (filename.find("service") != std::string::npos) {
            return "Business Logic";
        }
        if (filename.find("controller") != std::string::npos || filename.find("route") != std::string::npos) {
            return "API Controller";
        }
        if (filename.find("util") != std::string::npos || filename.find("helper") != std::string::npos) {
            return "Utility";
        }
        if (filename == "main.py" || filename == "app.py" || filename == "index.js" || 
            filename == "server.js" || filename == "main.cpp" || filename == "main.java") {
            return "Entry Point";
        }
        
        // Check content patterns
        if (!file.functions.empty()) {
            if (file.functions.size() > 5) {
                return "Business Logic";
            }
            return "Utility";
        }
        
        if (!file.classes.empty()) {
            return "Data Model";
        }
        
        return "General Code";
    }

    // Find entry points in the project
    std::vector<std::string> findEntryPoints(const std::string& repo_path) {
        std::vector<std::string> entry_points;
        
        try {
            std::vector<std::string> common_entry_points = {
                "main.py", "app.py", "manage.py", "run.py",
                "index.js", "app.js", "server.js", "main.js",
                "main.cpp", "main.c", "app.cpp", "server.cpp",
                "main.java", "Application.java", "App.java",
                "main.go", "main.rs", "Program.cs"
            };
            
            for (const auto& entry : fs::recursive_directory_iterator(repo_path)) {
                if (entry.is_regular_file()) {
                    std::string filename = entry.path().filename().string();
                    if (std::find(common_entry_points.begin(), common_entry_points.end(), filename) != common_entry_points.end()) {
                        entry_points.push_back(entry.path().string());
                    }
                }
            }
            
            logInfo("Found " + std::to_string(entry_points.size()) + " entry points");
            
        } catch (const std::exception& e) {
            logError("findEntryPoints", e);
        }
        
        return entry_points;
    }

    // Group files by module/directory
    std::map<std::string, std::vector<std::string>> groupFilesByModule(const std::string& repo_path) {
        std::map<std::string, std::vector<std::string>> modules;
        
        try {
            for (const auto& entry : fs::recursive_directory_iterator(repo_path)) {
                if (entry.is_regular_file()) {
                    std::string relative_path = fs::relative(entry.path(), repo_path).string();
                    std::string directory = fs::path(relative_path).parent_path().string();
                    
                    if (directory.empty()) {
                        directory = "root";
                    }
                    
                    modules[directory].push_back(relative_path);
                }
            }
            
            logInfo("Grouped files into " + std::to_string(modules.size()) + " modules");
            
        } catch (const std::exception& e) {
            logError("groupFilesByModule", e);
        }
        
        return modules;
    }

    // Detect build tools and package managers
    std::vector<std::string> detectBuildTools(const std::string& repo_path) {
        std::vector<std::string> build_tools;
        
        try {
            std::vector<std::string> build_files = {
                "package.json", "requirements.txt", "pom.xml", "build.gradle",
                "CMakeLists.txt", "Makefile", "Dockerfile", "docker-compose.yml",
                "Cargo.toml", "go.mod", "composer.json", "webpack.config.js",
                "tsconfig.json", ".gitlab-ci.yml", ".github/workflows", "Jenkinsfile"
            };
            
            for (const auto& entry : fs::recursive_directory_iterator(repo_path)) {
                if (entry.is_regular_file()) {
                    std::string filename = entry.path().filename().string();
                    if (std::find(build_files.begin(), build_files.end(), filename) != build_files.end()) {
                        build_tools.push_back(filename);
                    }
                }
            }
            
            logInfo("Detected " + std::to_string(build_tools.size()) + " build tools");
            
        } catch (const std::exception& e) {
            logError("detectBuildTools", e);
        }
        
        return build_tools;
    }

    // Extract dependencies from configuration files
    std::vector<std::string> extractDependencies(const std::string& repo_path) {
        std::vector<std::string> dependencies;
        
        try {
            // Check for package.json (Node.js)
            std::string package_json = repo_path + "/package.json";
            if (fs::exists(package_json)) {
                std::ifstream file(package_json);
                json data;
                file >> data;
                
                if (data.contains("dependencies")) {
                    for (auto& [dep, version] : data["dependencies"].items()) {
                        dependencies.push_back("npm:" + dep + "@" + version.get<std::string>());
                    }
                }
                
                if (data.contains("devDependencies")) {
                    for (auto& [dep, version] : data["devDependencies"].items()) {
                        dependencies.push_back("npm-dev:" + dep + "@" + version.get<std::string>());
                    }
                }
            }
            
            // Check for requirements.txt (Python)
            std::string requirements_txt = repo_path + "/requirements.txt";
            if (fs::exists(requirements_txt)) {
                std::ifstream file(requirements_txt);
                std::string line;
                while (std::getline(file, line)) {
                    if (!line.empty() && !line.starts_with("#")) {
                        dependencies.push_back("pypi:" + line);
                    }
                }
            }
            
            logInfo("Extracted " + std::to_string(dependencies.size()) + " dependencies");
            
        } catch (const std::exception& e) {
            logError("extractDependencies", e);
        }
        
        return dependencies;
    }

    // Detect architecture pattern
    std::string detectArchitecturePattern(const ProjectStructure& structure) {
        if (structure.modules.find("controllers") != structure.modules.end() &&
            structure.modules.find("models") != structure.modules.end() &&
            structure.modules.find("services") != structure.modules.end()) {
            return "Layered Architecture (MVC/MVCS)";
        }
        
        if (!structure.entry_points.empty() && structure.entry_points.size() == 1) {
            return "Monolithic Architecture";
        }
        
        if (structure.modules.size() > 5 && !structure.entry_points.empty()) {
            return "Modular Architecture";
        }
        
        return "Unknown Architecture Pattern";
    }

public:
    CodeAnalyzer(const std::string& repos_path) : repos_path_(repos_path) {
        try {
            if (!fs::exists(repos_path_)) {
                fs::create_directories(repos_path_);
                logInfo("Created repositories directory: " + repos_path_);
            }
            
            logInfo("CodeAnalyzer initialized successfully");
            logInfo("Repositories path: " + repos_path_);
            
        } catch (const std::exception& e) {
            logError("Constructor", e);
            throw;
        }
    }

    // Main repository analysis method
    json analyzeRepository(const std::string& repo_id) {
        try {
            logInfo("Starting analysis of repository: " + repo_id);
            
            std::string repo_path = repos_path_ + "/" + repo_id;
            
            if (!fs::exists(repo_path)) {
                throw std::runtime_error("Repository not found: " + repo_path);
            }
            
            ProjectStructure structure;
            structure.entry_points = findEntryPoints(repo_path);
            structure.build_tools = detectBuildTools(repo_path);
            structure.dependencies = extractDependencies(repo_path);
            
            // Analyze all code files
            std::map<std::string, std::vector<std::string>> modules = groupFilesByModule(repo_path);
            
            for (const auto& [module, files] : modules) {
                for (const auto& file_path : files) {
                    std::string full_path = repo_path + "/" + file_path;
                    CodeFile analyzed_file = analyzeFile(full_path);
                    
                    structure.modules[module].push_back(analyzed_file);
                    structure.total_files++;
                    structure.total_lines += analyzed_file.line_count;
                }
            }
            
            // Determine main language
            if (!structure.modules.empty()) {
                std::map<std::string, int> language_count;
                for (const auto& [module, files] : structure.modules) {
                    for (const auto& file : files) {
                        language_count[file.language]++;
                    }
                }
                
                if (!language_count.empty()) {
                    structure.main_language = std::max_element(
                        language_count.begin(), language_count.end(),
                        [](const auto& a, const auto& b) { return a.second < b.second; }
                    )->first;
                }
            }
            
            structure.architecture_pattern = detectArchitecturePattern(structure);
            
            // Convert to JSON
            json result;
            result["repo_id"] = repo_id;
            result["analysis"] = {
                {"main_language", structure.main_language},
                {"architecture_pattern", structure.architecture_pattern},
                {"total_files", structure.total_files},
                {"total_lines", structure.total_lines},
                {"entry_points", structure.entry_points},
                {"build_tools", structure.build_tools},
                {"dependencies", structure.dependencies}
            };
            
            // Add file details
            json files_json;
            for (const auto& [module, module_files] : structure.modules) {
                for (const auto& file : module_files) {
                    json file_json;
                    file_json["language"] = file.language;
                    file_json["purpose"] = file.purpose;
                    file_json["line_count"] = file.line_count;
                    file_json["complexity_score"] = file.complexity_score;
                    file_json["functions"] = file.functions;
                    file_json["classes"] = file.classes;
                    file_json["imports"] = file.imports;
                    
                    files_json[file.path] = file_json;
                }
            }
            result["files"] = files_json;
            
            logInfo("Repository analysis completed successfully");
            logInfo("Total files analyzed: " + std::to_string(structure.total_files));
            logInfo("Main language: " + structure.main_language);
            
            return result;
            
        } catch (const std::exception& e) {
            logError("analyzeRepository", e);
            throw std::runtime_error("Repository analysis failed for " + repo_id + ": " + std::string(e.what()));
        }
    }

    // API-specific analysis
    json analyzeAPIs(const std::string& repo_id) {
        try {
            logInfo("Starting API analysis for repository: " + repo_id);
            
            std::string repo_path = repos_path_ + "/" + repo_id;
            auto analysis = analyzeRepository(repo_id);
            
            std::vector<APIEndpoint> endpoints;
            
            // Look for API endpoints in the analysis
            if (analysis.contains("files")) {
                for (auto& [file_path, file_info] : analysis["files"].items()) {
                    std::string purpose = file_info.value("purpose", "");
                    if (purpose == "API Controller" || file_path.find("controller") != std::string::npos ||
                        file_path.find("route") != std::string::npos) {
                        
                        // Extract potential endpoints from function names
                        if (file_info.contains("functions")) {
                            for (auto& func : file_info["functions"]) {
                                APIEndpoint endpoint;
                                endpoint.file_location = file_path;
                                endpoint.description = "Auto-detected from function: " + func.get<std::string>();
                                
                                // Simple heuristic for endpoint path
                                std::string func_name = func.get<std::string>();
                                std::transform(func_name.begin(), func_name.end(), func_name.begin(), ::tolower);
                                
                                if (func_name.find("get") == 0) endpoint.method = "GET";
                                else if (func_name.find("post") == 0) endpoint.method = "POST";
                                else if (func_name.find("put") == 0) endpoint.method = "PUT";
                                else if (func_name.find("delete") == 0) endpoint.method = "DELETE";
                                else endpoint.method = "GET";
                                
                                // Generate path from function name
                                endpoint.path = "/api/" + func.get<std::string>();
                                
                                endpoints.push_back(endpoint);
                            }
                        }
                    }
                }
            }
            
            json result;
            result["repo_id"] = repo_id;
            result["api_count"] = endpoints.size();
            
            json endpoints_json = json::array();
            for (const auto& endpoint : endpoints) {
                endpoints_json.push_back({
                    {"path", endpoint.path},
                    {"method", endpoint.method},
                    {"description", endpoint.description},
                    {"file_location", endpoint.file_location}
                });
            }
            result["endpoints"] = endpoints_json;
            
            logInfo("API analysis completed. Found " + std::to_string(endpoints.size()) + " endpoints");
            
            return result;
            
        } catch (const std::exception& e) {
            logError("analyzeAPIs", e);
            throw;
        }
    }

    // Architecture analysis
    json analyzeArchitecture(const std::string& repo_id) {
        try {
            logInfo("Starting architecture analysis for repository: " + repo_id);
            
            auto analysis = analyzeRepository(repo_id);
            json result;
            
            result["repo_id"] = repo_id;
            result["architecture"] = analysis["analysis"];
            
            // Add module statistics
            if (analysis.contains("files")) {
                std::map<std::string, int> module_stats;
                std::map<std::string, int> purpose_stats;
                
                for (auto& [file_path, file_info] : analysis["files"].items()) {
                    std::string module = fs::path(file_path).parent_path().string();
                    if (module.empty()) module = "root";
                    
                    module_stats[module]++;
                    purpose_stats[file_info.value("purpose", "Unknown")]++;
                }
                
                result["module_distribution"] = module_stats;
                result["purpose_distribution"] = purpose_stats;
            }
            
            logInfo("Architecture analysis completed");
            
            return result;
            
        } catch (const std::exception& e) {
            logError("analyzeArchitecture", e);
            throw;
        }
    }

    // Generate comprehensive code summary
    json generateCodeSummary(const std::string& repo_id) {
        try {
            logInfo("Generating comprehensive code summary for: " + repo_id);
            
            auto analysis = analyzeRepository(repo_id);
            
            json summary;
            summary["repo_id"] = repo_id;
            summary["timestamp"] = "2024-01-01"; // TODO: Add actual timestamp
            
            // Extract key metrics
            if (analysis.contains("analysis")) {
                summary["main_language"] = analysis["analysis"].value("main_language", "Unknown");
                summary["total_files"] = analysis["analysis"].value("total_files", 0);
                summary["total_lines"] = analysis["analysis"].value("total_lines", 0);
                summary["architecture"] = analysis["analysis"].value("architecture_pattern", "Unknown");
            }
            
            // File type breakdown
            if (analysis.contains("files")) {
                std::map<std::string, int> language_breakdown;
                std::map<std::string, int> purpose_breakdown;
                int total_functions = 0;
                int total_classes = 0;
                
                for (auto& [file_path, file_info] : analysis["files"].items()) {
                    std::string language = file_info.value("language", "Unknown");
                    std::string purpose = file_info.value("purpose", "Unknown");
                    
                    language_breakdown[language]++;
                    purpose_breakdown[purpose]++;
                    
                    if (file_info.contains("functions")) {
                        total_functions += file_info["functions"].size();
                    }
                    if (file_info.contains("classes")) {
                        total_classes += file_info["classes"].size();
                    }
                }
                
                summary["language_breakdown"] = language_breakdown;
                summary["purpose_breakdown"] = purpose_breakdown;
                summary["total_functions"] = total_functions;
                summary["total_classes"] = total_classes;
            }
            
            logInfo("Code summary generated successfully");
            
            return summary;
            
        } catch (const std::exception& e) {
            logError("generateCodeSummary", e);
            throw;
        }
    }
};

#endif // CODE_ANALYZER_H