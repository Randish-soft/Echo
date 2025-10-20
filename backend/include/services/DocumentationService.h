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

// Documentation types
enum class DocType {
    API_REFERENCE,
    ARCHITECTURE_OVERVIEW,
    GETTING_STARTED,
    DEPLOYMENT_GUIDE,
    CODE_WALKTHROUGH,
    TROUBLESHOOTING,
    CONTRIBUTING_GUIDE,
    INTERNAL,
    EXTERNAL
};

// Audience types
enum class Audience {
    DEVELOPERS,
    END_USERS,
    MANAGERS,
    CONTRIBUTORS,
    OPERATIONS
};

// Documentation section structure
struct DocSection {
    std::string title;
    std::string content;
    std::string language; // For code examples
    int depth;
    
    DocSection(const std::string& t, const std::string& c, int d = 2, const std::string& lang = "")
        : title(t), content(c), depth(d), language(lang) {}
};

// Complete documentation structure
struct Documentation {
    std::string repo_id;
    DocType doc_type;
    Audience audience;
    std::string title;
    std::string overview;
    std::vector<DocSection> sections;
    std::map<std::string, std::string> metadata;
    std::string generated_at;
    
    Documentation() : doc_type(DocType::INTERNAL), audience(Audience::DEVELOPERS), overview("") {}
};

class DocumentationService {
private:
    std::string summaries_path;
    
    // Enhanced logging
    void logInfo(const std::string& message) {
        std::cout << "📝 [DocumentationService] " << message << std::endl;
    }
    
    void logError(const std::string& context, const std::exception& e) {
        std::cerr << "❌ [DocumentationService] Error in " << context << ": " << e.what() << std::endl;
    }
    
    void logWarning(const std::string& message) {
        std::cout << "⚠️ [DocumentationService] " << message << std::endl;
    }

    // Load repository data from saved JSON with error handling
    json loadRepositoryData(const std::string& repo_id) {
        std::string summary_file = summaries_path + "/" + repo_id + ".json";
        
        logInfo("Loading repository data from: " + summary_file);
        
        if (!fs::exists(summary_file)) {
            throw std::runtime_error("Repository data not found: " + repo_id + " at path: " + summary_file);
        }
        
        try {
            std::ifstream file(summary_file);
            if (!file.is_open()) {
                throw std::runtime_error("Failed to open file: " + summary_file);
            }
            
            json data;
            file >> data;
            logInfo("Successfully loaded repository data for: " + repo_id);
            return data;
            
        } catch (const std::exception& e) {
            throw std::runtime_error("Failed to parse repository data for " + repo_id + ": " + std::string(e.what()));
        }
    }

    // Get current timestamp as string
    std::string getCurrentTimestamp() {
        std::time_t now = std::time(nullptr);
        char buf[100];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
        return std::string(buf);
    }

    // Organize files by their type/purpose with enhanced categorization
    std::map<std::string, std::vector<std::pair<std::string, json>>> organizeFilesByType(const json& files) {
        logInfo("Organizing files by type...");
        std::map<std::string, std::vector<std::pair<std::string, json>>> organized;
        
        try {
            for (auto& [file_path, file_info] : files.items()) {
                std::string summary = file_info.value("summary", "");
                std::string filename = fs::path(file_path).filename().string();
                
                // Convert to lowercase for comparison
                std::transform(filename.begin(), filename.end(), filename.begin(), ::tolower);
                std::transform(summary.begin(), summary.end(), summary.begin(), ::tolower);
                
                // Enhanced categorization logic
                if (summary.find("entry point") != std::string::npos || 
                    summary.find("main") != std::string::npos ||
                    filename == "main.py" || filename == "app.py" || filename == "main.cpp" ||
                    filename == "index.js" || filename == "server.js" || filename == "app.js" ||
                    filename == "main.go" || filename == "main.rs" || filename == "main.java") {
                    organized["entry_points"].push_back({file_path, file_info});
                } 
                else if (summary.find("model") != std::string::npos || 
                         summary.find("schema") != std::string::npos ||
                         summary.find("entity") != std::string::npos ||
                         filename.find("model") != std::string::npos) {
                    organized["models"].push_back({file_path, file_info});
                } 
                else if (summary.find("service") != std::string::npos ||
                         summary.find("business") != std::string::npos ||
                         summary.find("logic") != std::string::npos) {
                    organized["services"].push_back({file_path, file_info});
                } 
                else if (summary.find("controller") != std::string::npos || 
                         summary.find("route") != std::string::npos ||
                         summary.find("endpoint") != std::string::npos ||
                         summary.find("api") != std::string::npos) {
                    organized["controllers"].push_back({file_path, file_info});
                } 
                else if (summary.find("utility") != std::string::npos || 
                         summary.find("helper") != std::string::npos ||
                         summary.find("util") != std::string::npos) {
                    organized["utilities"].push_back({file_path, file_info});
                } 
                else if (summary.find("test") != std::string::npos ||
                         filename.find("test") != std::string::npos ||
                         filename.find("spec") != std::string::npos) {
                    organized["tests"].push_back({file_path, file_info});
                } 
                else if (summary.find("config") != std::string::npos ||
                         summary.find("setting") != std::string::npos ||
                         filename.find("config") != std::string::npos ||
                         filename.find(".env") != std::string::npos) {
                    organized["config"].push_back({file_path, file_info});
                }
                else if (filename.find("docker") != std::string::npos ||
                         filename == "dockerfile" || filename.find("compose") != std::string::npos) {
                    organized["deployment"].push_back({file_path, file_info});
                }
                else if (filename.find("readme") != std::string::npos ||
                         filename.find("license") != std::string::npos ||
                         filename.find("contributing") != std::string::npos) {
                    organized["documentation"].push_back({file_path, file_info});
                }
                else {
                    organized["other"].push_back({file_path, file_info});
                }
            }
            
            logInfo("File organization completed. Categories found: " + std::to_string(organized.size()));
            
        } catch (const std::exception& e) {
            logError("organizeFilesByType", e);
            throw;
        }
        
        return organized;
    }

    // Calculate project statistics with error handling
    std::map<std::string, int> getProjectStats(const json& repo_data) {
        std::map<std::string, int> stats;
        
        try {
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
            stats["unique_languages"] = languages.size();
            
            // Add language counts
            for (const auto& [lang, count] : languages) {
                stats["files_" + lang] = count;
            }
            
        } catch (const std::exception& e) {
            logError("getProjectStats", e);
            // Return basic stats even if detailed analysis fails
            stats["total_files"] = repo_data.value("analyzed_files", 0);
            stats["total_lines"] = 0;
            stats["unique_languages"] = 0;
        }
        
        return stats;
    }

    // Convert string to DocType enum
    DocType stringToDocType(const std::string& doc_type_str) {
        if (doc_type_str == "api_reference") return DocType::API_REFERENCE;
        if (doc_type_str == "architecture") return DocType::ARCHITECTURE_OVERVIEW;
        if (doc_type_str == "getting_started") return DocType::GETTING_STARTED;
        if (doc_type_str == "deployment") return DocType::DEPLOYMENT_GUIDE;
        if (doc_type_str == "walkthrough") return DocType::CODE_WALKTHROUGH;
        if (doc_type_str == "troubleshooting") return DocType::TROUBLESHOOTING;
        if (doc_type_str == "contributing") return DocType::CONTRIBUTING_GUIDE;
        if (doc_type_str == "internal") return DocType::INTERNAL;
        if (doc_type_str == "external") return DocType::EXTERNAL;
        
        throw std::runtime_error("Unknown documentation type: " + doc_type_str);
    }

    // Convert string to Audience enum
    Audience stringToAudience(const std::string& audience_str) {
        if (audience_str == "developers") return Audience::DEVELOPERS;
        if (audience_str == "users") return Audience::END_USERS;
        if (audience_str == "managers") return Audience::MANAGERS;
        if (audience_str == "contributors") return Audience::CONTRIBUTORS;
        if (audience_str == "operations") return Audience::OPERATIONS;
        
        throw std::runtime_error("Unknown audience: " + audience_str);
    }

    // Format documentation based on audience
    std::string formatForAudience(const Documentation& doc) {
        std::stringstream ss;
        
        ss << "# " << doc.title << "\n\n";
        ss << "*Generated on: " << doc.generated_at << "*\n";
        ss << "*Repository: " << doc.repo_id << "*\n";
        ss << "*Audience: " << (doc.audience == Audience::DEVELOPERS ? "Developers" : 
                               doc.audience == Audience::END_USERS ? "End Users" :
                               doc.audience == Audience::MANAGERS ? "Managers" :
                               doc.audience == Audience::CONTRIBUTORS ? "Contributors" : "Operations") << "*\n\n";
        
        if (!doc.overview.empty()) {
            ss << "## Overview\n" << doc.overview << "\n\n";
        }
        
        for (const auto& section : doc.sections) {
            std::string prefix = std::string(section.depth, '#') + " ";
            ss << prefix << section.title << "\n\n";
            ss << section.content << "\n\n";
            
            if (!section.language.empty()) {
                ss << "```" << section.language << "\n";
                // Add code content here if needed
                ss << "```\n\n";
            }
        }
        
        // Add metadata if available
        if (!doc.metadata.empty()) {
            ss << "---\n\n";
            ss << "## Metadata\n\n";
            for (const auto& [key, value] : doc.metadata) {
                ss << "- **" << key << "**: " << value << "\n";
            }
        }
        
        return ss.str();
    }

public:
    DocumentationService() {
        try {
            const char* summaries = std::getenv("SUMMARIES_PATH");
            summaries_path = summaries ? summaries : "/app/data/summaries";
            
            // Create directory if it doesn't exist
            if (!fs::exists(summaries_path)) {
                fs::create_directories(summaries_path);
                logInfo("Created summaries directory: " + summaries_path);
            }
            
            logInfo("Documentation service initialized successfully");
            logInfo("Summaries path: " + summaries_path);
            
        } catch (const std::exception& e) {
            logError("Constructor", e);
            throw;
        }
    }

    // Generate comprehensive documentation using the new pipeline
    std::string generateDocumentation(
        const std::string& repo_id, 
        const std::string& doc_type_str, 
        const std::string& audience_str = "developers"
    ) {
        try {
            logInfo("Starting documentation generation pipeline");
            logInfo("Repository: " + repo_id + ", Type: " + doc_type_str + ", Audience: " + audience_str);
            
            // Convert string parameters to enums
            DocType doc_type = stringToDocType(doc_type_str);
            Audience audience = stringToAudience(audience_str);
            
            // Load repository data
            json repo_data = loadRepositoryData(repo_id);
            
            // Create documentation structure
            Documentation doc;
            doc.repo_id = repo_id;
            doc.doc_type = doc_type;
            doc.audience = audience;
            doc.generated_at = getCurrentTimestamp();
            
            // Generate documentation based on type
            switch (doc_type) {
                case DocType::INTERNAL:
                    doc.title = "Internal Documentation - " + repo_id;
                    generateInternalDocumentation(doc, repo_data);
                    break;
                case DocType::EXTERNAL:
                    doc.title = "User Documentation - " + repo_id;
                    generateExternalDocumentation(doc, repo_data);
                    break;
                case DocType::API_REFERENCE:
                    doc.title = "API Reference - " + repo_id;
                    generateAPIReference(doc, repo_data);
                    break;
                case DocType::ARCHITECTURE_OVERVIEW:
                    doc.title = "Architecture Overview - " + repo_id;
                    generateArchitectureOverview(doc, repo_data);
                    break;
                default:
                    logWarning("Documentation type not fully implemented: " + doc_type_str);
                    doc.title = "Documentation - " + repo_id;
                    generateInternalDocumentation(doc, repo_data); // Fallback
            }
            
            // Format for target audience
            std::string result = formatForAudience(doc);
            
            logInfo("Documentation generation completed successfully");
            logInfo("Generated " + std::to_string(result.length()) + " characters");
            
            return result;
            
        } catch (const std::exception& e) {
            logError("generateDocumentation", e);
            throw std::runtime_error("Documentation generation failed for " + repo_id + ": " + std::string(e.what()));
        }
    }

private:
    // Enhanced internal documentation generation
    void generateInternalDocumentation(Documentation& doc, const json& repo_data) {
        try {
            logInfo("Generating internal documentation");
            
            doc.overview = "This document provides comprehensive internal documentation for developers working on this project.";
            
            // Calculate statistics
            auto stats = getProjectStats(repo_data);
            auto organized = organizeFilesByType(repo_data["files"]);
            
            // Project Overview section
            DocSection overview("Project Overview", "");
            overview.content = "**Statistics:**\n";
            overview.content += "- Total Files: " + std::to_string(stats["total_files"]) + "\n";
            overview.content += "- Total Lines of Code: " + std::to_string(stats["total_lines"]) + "\n";
            overview.content += "- Unique Languages: " + std::to_string(stats["unique_languages"]) + "\n";
            
            // Add language breakdown
            for (const auto& [key, value] : stats) {
                if (key.find("files_") == 0) {
                    std::string lang = key.substr(6); // Remove "files_" prefix
                    overview.content += "- " + lang + " files: " + std::to_string(value) + "\n";
                }
            }
            
            doc.sections.push_back(overview);
            
            // Architecture sections
            addArchitectureSections(doc, organized);
            addTechnicalDetails(doc, repo_data, organized);
            
        } catch (const std::exception& e) {
            logError("generateInternalDocumentation", e);
            throw;
        }
    }

    // Enhanced external documentation generation
    void generateExternalDocumentation(Documentation& doc, const json& repo_data) {
        try {
            logInfo("Generating external documentation");
            
            doc.overview = "This document provides user-friendly documentation for end users and stakeholders.";
            
            auto stats = getProjectStats(repo_data);
            auto organized = organizeFilesByType(repo_data["files"]);
            
            // Overview section
            DocSection overview("Overview", "");
            overview.content = "This project consists of " + std::to_string(stats["total_files"]) + 
                             " files with approximately " + std::to_string(stats["total_lines"]) + 
                             " lines of code.\n\n";
            overview.content += "The system is designed to be robust and maintainable.";
            doc.sections.push_back(overview);
            
            // Getting Started
            DocSection gettingStarted("Getting Started", "");
            gettingStarted.content = "## Installation\n\n";
            gettingStarted.content += "1. Clone the repository\n";
            gettingStarted.content += "2. Install dependencies\n";
            gettingStarted.content += "3. Configure environment variables\n";
            gettingStarted.content += "4. Run the application\n\n";
            
            // Add configuration files info
            if (!organized["config"].empty()) {
                gettingStarted.content += "### Configuration\n\n";
                gettingStarted.content += "Key configuration files:\n";
                for (const auto& [file_path, file_info] : organized["config"]) {
                    gettingStarted.content += "- `" + file_path + "`: " + file_info.value("summary", "Configuration file") + "\n";
                }
            }
            doc.sections.push_back(gettingStarted);
            
            // Features section
            addFeaturesSection(doc, organized);
            addAPISection(doc, organized);
            addFAQSection(doc);
            
        } catch (const std::exception& e) {
            logError("generateExternalDocumentation", e);
            throw;
        }
    }

    // API Reference documentation
    void generateAPIReference(Documentation& doc, const json& repo_data) {
        try {
            logInfo("Generating API reference documentation");
            
            doc.overview = "Comprehensive API reference documentation for developers.";
            
            auto organized = organizeFilesByType(repo_data["files"]);
            
            // API Overview
            DocSection overview("API Overview", "");
            overview.content = "This section documents all available API endpoints and their usage.\n\n";
            
            if (!organized["controllers"].empty()) {
                overview.content += "The API is organized into " + std::to_string(organized["controllers"].size()) + " main controller files.";
            }
            doc.sections.push_back(overview);
            
            // Add endpoint documentation
            addEndpointDocumentation(doc, organized);
            
        } catch (const std::exception& e) {
            logError("generateAPIReference", e);
            throw;
        }
    }

    // Architecture overview documentation
    void generateArchitectureOverview(Documentation& doc, const json& repo_data) {
        try {
            logInfo("Generating architecture overview documentation");
            
            doc.overview = "Architecture overview and system design documentation.";
            
            auto organized = organizeFilesByType(repo_data["files"]);
            
            // System Architecture
            DocSection architecture("System Architecture", "");
            architecture.content = "High-level overview of the system architecture and design patterns.\n\n";
            
            // Detect architecture pattern based on file organization
            if (!organized["entry_points"].empty()) {
                architecture.content += "**Architecture Pattern**: Modular with clear entry points\n\n";
            }
            
            if (!organized["models"].empty() && !organized["services"].empty() && !organized["controllers"].empty()) {
                architecture.content += "**Design Pattern**: Layered Architecture (Models-Services-Controllers)\n\n";
            }
            
            doc.sections.push_back(architecture);
            
            addArchitectureSections(doc, organized);
            addComponentDetails(doc, organized);
            
        } catch (const std::exception& e) {
            logError("generateArchitectureOverview", e);
            throw;
        }
    }

    // Helper methods for section generation
    void addArchitectureSections(Documentation& doc, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Entry Points
        if (!organized["entry_points"].empty()) {
            DocSection entryPoints("Entry Points", "");
            entryPoints.content = "Main application entry points:\n\n";
            for (const auto& [file_path, file_info] : organized["entry_points"]) {
                entryPoints.content += "### `" + file_path + "`\n";
                entryPoints.content += file_info.value("summary", "No summary available") + "\n\n";
            }
            doc.sections.push_back(entryPoints);
        }
        
        // Similar implementations for other sections...
        // [Rest of the helper methods would be implemented here]
    }

    void addTechnicalDetails(Documentation& doc, const json& repo_data, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Implementation for technical details
    }

    void addFeaturesSection(Documentation& doc, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Implementation for features section
    }

    void addAPISection(Documentation& doc, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Implementation for API section
    }

    void addFAQSection(Documentation& doc) {
        // Implementation for FAQ section
    }

    void addEndpointDocumentation(Documentation& doc, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Implementation for endpoint documentation
    }

    void addComponentDetails(Documentation& doc, const std::map<std::string, std::vector<std::pair<std::string, json>>>& organized) {
        // Implementation for component details
    }

public:
    // Get available documentation types
    std::vector<std::string> getAvailableDocTypes() {
        return {
            "internal",
            "external",
            "api_reference", 
            "architecture",
            "getting_started",
            "deployment",
            "walkthrough",
            "troubleshooting",
            "contributing"
        };
    }

    // Get available audiences
    std::vector<std::string> getAvailableAudiences() {
        return {
            "developers",
            "users",
            "managers",
            "contributors", 
            "operations"
        };
    }
};

#endif // DOCUMENTATION_SERVICE_H