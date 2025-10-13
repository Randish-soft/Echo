#ifndef DOCUMENTATION_SERVICE_H
#define DOCUMENTATION_SERVICE_H

#include <string>
#include <map>
#include <vector>
#include <fstream>
#include <sstream>
#include <filesystem>
#include <ctime>
#include <algorithm>
#include <iostream>
#include <nlohmann/json.hpp>

namespace fs = std::filesystem;
using json = nlohmann::json;

class DocumentationService {
private:
    std::string summaries_path;

    // Load repository data from saved JSON
    json loadRepositoryData(const std::string& repo_id) {
        std::string summary_file = summaries_path + "/" + repo_id + ".json";
        
        if (!fs::exists(summary_file)) {
            throw std::runtime_error("Repository data not found: " + repo_id);
        }
        
        std::ifstream file(summary_file);
        json data;
        file >> data;
        return data;
    }

    // Get current timestamp as string
    std::string getCurrentTimestamp() {
        std::time_t now = std::time(nullptr);
        char buf[100];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
        return std::string(buf);
    }

    // Organize files by their type/purpose
    std::map<std::string, std::vector<std::pair<std::string, json>>> organizeFilesByType(const json& files) {
        std::map<std::string, std::vector<std::pair<std::string, json>>> organized;
        
        for (auto& [file_path, file_info] : files.items()) {
            std::string summary = file_info.value("summary", "");
            std::string filename = fs::path(file_path).filename().string();
            
            // Convert to lowercase for comparison
            std::transform(filename.begin(), filename.end(), filename.begin(), ::tolower);
            std::transform(summary.begin(), summary.end(), summary.begin(), ::tolower);
            
            // Categorize files
            if (summary.find("entry point") != std::string::npos || 
                filename == "main.py" || filename == "app.py" || 
                filename == "index.js" || filename == "server.js") {
                organized["entry_points"].push_back({file_path, file_info});
            } 
            else if (summary.find("model") != std::string::npos || 
                     summary.find("schema") != std::string::npos) {
                organized["models"].push_back({file_path, file_info});
            } 
            else if (summary.find("service") != std::string::npos) {
                organized["services"].push_back({file_path, file_info});
            } 
            else if (summary.find("controller") != std::string::npos || 
                     summary.find("route") != std::string::npos) {
                organized["controllers"].push_back({file_path, file_info});
            } 
            else if (summary.find("utility") != std::string::npos || 
                     summary.find("helper") != std::string::npos) {
                organized["utilities"].push_back({file_path, file_info});
            } 
            else if (summary.find("test") != std::string::npos) {
                organized["tests"].push_back({file_path, file_info});
            } 
            else if (summary.find("config") != std::string::npos) {
                organized["config"].push_back({file_path, file_info});
            } 
            else {
                organized["other"].push_back({file_path, file_info});
            }
        }
        
        return organized;
    }

    // Calculate project statistics
    std::map<std::string, int> getProjectStats(const json& repo_data) {
        std::map<std::string, int> stats;
        
        int total_lines = 0;
        std::map<std::string, int> languages;
        
        if (repo_data.contains("files")) {
            for (auto& [file_path, file_info] : repo_data["files"].items()) {
                if (file_info.contains("analysis")) {
                    // Count lines
                    total_lines += file_info["analysis"].value("lines", 0);
                    
                    // Count languages
                    std::string file_type = file_info["analysis"].value("type", "unknown");
                    languages[file_type]++;
                }
            }
        }
        
        stats["total_files"] = repo_data.value("analyzed_files", 0);
        stats["total_lines"] = total_lines;
        
        return stats;
    }

public:
    DocumentationService() {
        const char* summaries = std::getenv("SUMMARIES_PATH");
        summaries_path = summaries ? summaries : "./data/summaries";
        std::cout << "✓ Documentation service initialized" << std::endl;
    }

    // Generate internal documentation for developers
    std::string generateInternalDocumentation(const json& repo_data, const std::string& audience) {
        std::ostringstream doc;
        
        doc << "# Internal Documentation\n";
        doc << "Generated: " << getCurrentTimestamp() << "\n";
        doc << "Audience: " << audience << "\n\n";
        
        doc << "---\n\n";
        doc << "## Project Overview\n\n";
        
        // Calculate statistics
        auto stats = getProjectStats(repo_data);
        
        doc << "**Statistics:**\n";
        doc << "- Total Files: " << stats["total_files"] << "\n";
        doc << "- Total Lines of Code: " << stats["total_lines"] << "\n";
        
        // Count languages
        std::map<std::string, int> languages;
        if (repo_data.contains("files")) {
            for (auto& [file_path, file_info] : repo_data["files"].items()) {
                if (file_info.contains("analysis")) {
                    std::string type = file_info["analysis"].value("type", "unknown");
                    languages[type]++;
                }
            }
        }
        
        doc << "- Languages: ";
        for (const auto& [lang, count] : languages) {
            doc << lang << " (" << count << ") ";
        }
        doc << "\n\n";
        
        doc << "---\n\n";
        doc << "## Architecture\n\n";
        
        // Organize files by type
        auto organized = organizeFilesByType(repo_data["files"]);
        
        // Entry Points
        doc << "### Entry Points\n\n";
        if (!organized["entry_points"].empty()) {
            for (const auto& [file_path, file_info] : organized["entry_points"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n";
                
                if (file_info.contains("analysis") && file_info["analysis"].contains("functions")) {
                    doc << "- Key functions: ";
                    int count = 0;
                    for (const auto& func : file_info["analysis"]["functions"]) {
                        if (count++ >= 5) break;
                        doc << func.get<std::string>() << ", ";
                    }
                    doc << "\n";
                }
                doc << "\n";
            }
        } else {
            doc << "No entry point files detected.\n\n";
        }
        
        // Data Models
        doc << "### Data Models\n\n";
        if (!organized["models"].empty()) {
            for (const auto& [file_path, file_info] : organized["models"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n";
                
                if (file_info.contains("analysis") && file_info["analysis"].contains("classes")) {
                    doc << "- Classes: ";
                    for (const auto& cls : file_info["analysis"]["classes"]) {
                        doc << cls.get<std::string>() << ", ";
                    }
                    doc << "\n";
                }
                doc << "\n";
            }
        } else {
            doc << "No model files detected.\n\n";
        }
        
        // Services
        doc << "### Services & Business Logic\n\n";
        if (!organized["services"].empty()) {
            for (const auto& [file_path, file_info] : organized["services"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n\n";
            }
        } else {
            doc << "No service files detected.\n\n";
        }
        
        // Controllers
        doc << "### Controllers & Routes\n\n";
        if (!organized["controllers"].empty()) {
            for (const auto& [file_path, file_info] : organized["controllers"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n\n";
            }
        } else {
            doc << "No controller/route files detected.\n\n";
        }
        
        // Utilities
        doc << "### Utilities\n\n";
        if (!organized["utilities"].empty()) {
            for (const auto& [file_path, file_info] : organized["utilities"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n\n";
            }
        } else {
            doc << "No utility files detected.\n\n";
        }
        
        // Configuration
        doc << "### Configuration\n\n";
        if (!organized["config"].empty()) {
            for (const auto& [file_path, file_info] : organized["config"]) {
                doc << "**" << file_path << "**\n";
                doc << "- " << file_info.value("summary", "No summary") << "\n\n";
            }
        } else {
            doc << "No configuration files detected.\n\n";
        }
        
        // Tests
        doc << "### Tests\n\n";
        if (!organized["tests"].empty()) {
            doc << "Test coverage includes " << organized["tests"].size() << " test file(s):\n\n";
            for (const auto& [file_path, file_info] : organized["tests"]) {
                doc << "- **" << file_path << "**\n";
            }
            doc << "\n";
        } else {
            doc << "No test files detected.\n\n";
        }
        
        doc << "---\n\n";
        doc << "## Development Notes\n\n";
        doc << "### File Structure Summary\n\n";
        doc << "- Entry Points: " << organized["entry_points"].size() << "\n";
        doc << "- Models: " << organized["models"].size() << "\n";
        doc << "- Services: " << organized["services"].size() << "\n";
        doc << "- Controllers: " << organized["controllers"].size() << "\n";
        doc << "- Utilities: " << organized["utilities"].size() << "\n";
        doc << "- Tests: " << organized["tests"].size() << "\n";
        doc << "- Configuration: " << organized["config"].size() << "\n";
        doc << "- Other: " << organized["other"].size() << "\n\n";
        
        return doc.str();
    }

    // Generate external documentation for end users
    std::string generateExternalDocumentation(const json& repo_data, const std::string& audience) {
        std::ostringstream doc;
        
        doc << "# User Documentation\n";
        doc << "Generated: " << getCurrentTimestamp() << "\n\n";
        
        doc << "## Overview\n\n";
        
        auto stats = getProjectStats(repo_data);
        doc << "This project consists of " << stats["total_files"] << " files ";
        doc << "with approximately " << stats["total_lines"] << " lines of code.\n\n";
        
        doc << "---\n\n";
        doc << "## Getting Started\n\n";
        doc << "### Installation\n\n";
        doc << "1. Clone the repository\n";
        doc << "2. Install dependencies\n";
        doc << "3. Configure environment variables\n";
        doc << "4. Run the application\n\n";
        
        // Configuration section
        auto organized = organizeFilesByType(repo_data["files"]);
        
        if (!organized["config"].empty()) {
            doc << "### Configuration Files\n\n";
            doc << "The following configuration files are available:\n\n";
            for (const auto& [file_path, file_info] : organized["config"]) {
                doc << "- **" << file_path << "**: " << file_info.value("summary", "Configuration file") << "\n";
            }
            doc << "\n";
        }
        
        // Features from entry points
        if (!organized["entry_points"].empty()) {
            doc << "## Features\n\n";
            for (const auto& [file_path, file_info] : organized["entry_points"]) {
                doc << "Based on **" << file_path << "**:\n";
                if (file_info.contains("analysis") && file_info["analysis"].contains("functions")) {
                    for (const auto& func : file_info["analysis"]["functions"]) {
                        doc << "- " << func.get<std::string>() << "\n";
                    }
                }
                doc << "\n";
            }
        }
        
        // API Endpoints from controllers
        if (!organized["controllers"].empty()) {
            doc << "## API Endpoints\n\n";
            for (const auto& [file_path, file_info] : organized["controllers"]) {
                doc << "### " << fs::path(file_path).filename().string() << "\n";
                doc << file_info.value("summary", "API endpoint") << "\n\n";
            }
        }
        
        doc << "---\n\n";
        doc << "## FAQ\n\n";
        doc << "### How do I start the application?\n";
        doc << "Refer to the entry point files for startup instructions.\n\n";
        
        doc << "### What are the system requirements?\n";
        doc << "This project is built with multiple technologies. Check the configuration files for specific requirements.\n\n";
        
        doc << "### Where can I find more information?\n";
        doc << "Please refer to the internal documentation or contact the development team.\n\n";
        
        return doc.str();
    }

    // Main documentation generation function
    std::string generateDocumentation(
        const std::string& repo_id, 
        const std::string& doc_type, 
        const std::string& audience = "developers"
    ) {
        std::cout << "📝 Generating " << doc_type << " documentation for repo: " << repo_id << std::endl;
        
        // Load repository data
        json repo_data = loadRepositoryData(repo_id);
        
        if (doc_type == "internal") {
            return generateInternalDocumentation(repo_data, audience);
        } 
        else if (doc_type == "external") {
            return generateExternalDocumentation(repo_data, audience);
        } 
        else {
            throw std::runtime_error("Unknown documentation type: " + doc_type);
        }
    }
};

#endif // DOCUMENTATION_SERVICE_H