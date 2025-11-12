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
#include "LLMService.h"
#include "PromptTemplates.h"

namespace fs = std::filesystem;
using json = nlohmann::json;

class DocumentationService {
private:
    std::string summaries_path;
    std::shared_ptr<LLMService> llm_service;

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

    // Build repository overview string
    std::string buildRepositoryOverview(const json& repo_data) {
        std::ostringstream overview;

        int total_files = repo_data.value("analyzed_files", 0);
        int total_lines = 0;
        std::map<std::string, int> languages;

        if (repo_data.contains("files")) {
            for (auto& [file_path, file_info] : repo_data["files"].items()) {
                if (file_info.contains("analysis")) {
                    total_lines += file_info["analysis"].value("lines", 0);
                    std::string type = file_info["analysis"].value("type", "unknown");
                    languages[type]++;
                }
            }
        }

        overview << "- Total Files: " << total_files << "\n";
        overview << "- Total Lines of Code: " << total_lines << "\n";
        overview << "- Languages/Technologies: ";

        for (const auto& [lang, count] : languages) {
            overview << lang << " (" << count << " files), ";
        }

        return overview.str();
    }

    // Build file structure summary
    std::string buildFileStructure(const json& repo_data) {
        std::ostringstream structure;

        if (!repo_data.contains("files")) {
            return "No file information available.\n";
        }

        // Organize files by directory
        std::map<std::string, std::vector<std::string>> dirs;

        for (auto& [file_path, file_info] : repo_data["files"].items()) {
            fs::path p(file_path);
            std::string dir = p.parent_path().string();
            if (dir.empty()) dir = ".";
            dirs[dir].push_back(p.filename().string());
        }

        // Output structure
        for (const auto& [dir, files] : dirs) {
            structure << "**" << dir << "/**\n";
            for (const auto& file : files) {
                structure << "  - " << file << "\n";
            }
            structure << "\n";
        }

        return structure.str();
    }

    // Build key files summary with analysis
    std::string buildKeyFilesSummary(const json& repo_data) {
        std::ostringstream summary;

        if (!repo_data.contains("files")) {
            return "No file analysis available.\n";
        }

        // Categorize files with expanded patterns
        std::map<std::string, std::vector<std::pair<std::string, json>>> organized;

        for (auto& [file_path, file_info] : repo_data["files"].items()) {
            std::string file_summary = file_info.value("summary", "");
            std::string filename = fs::path(file_path).filename().string();
            std::string extension = fs::path(file_path).extension().string();
            std::string directory = fs::path(file_path).parent_path().string();

            std::string lower_summary = file_summary;
            std::transform(lower_summary.begin(), lower_summary.end(),
                         lower_summary.begin(), ::tolower);

            std::string lower_filename = filename;
            std::transform(lower_filename.begin(), lower_filename.end(),
                         lower_filename.begin(), ::tolower);

            std::string lower_directory = directory;
            std::transform(lower_directory.begin(), lower_directory.end(),
                         lower_directory.begin(), ::tolower);

            // Enhanced categorization logic
            bool categorized = false;

            // Entry points
            if (!categorized && (
                lower_summary.find("entry point") != std::string::npos ||
                lower_summary.find("main application") != std::string::npos ||
                filename == "main.py" || filename == "app.py" ||
                filename == "index.js" || filename == "main.cpp" ||
                filename == "main.java" || filename == "server.js" ||
                filename == "index.ts" || filename == "main.go")) {
                organized["Entry Points"].push_back({file_path, file_info});
                categorized = true;
            }

            // Models and Data Structures
            if (!categorized && (
                lower_summary.find("model") != std::string::npos ||
                lower_summary.find("schema") != std::string::npos ||
                lower_summary.find("entity") != std::string::npos ||
                lower_summary.find("data structure") != std::string::npos ||
                lower_directory.find("model") != std::string::npos ||
                lower_directory.find("entity") != std::string::npos ||
                lower_directory.find("schema") != std::string::npos)) {
                organized["Models & Data Structures"].push_back({file_path, file_info});
                categorized = true;
            }

            // Services and Business Logic
            if (!categorized && (
                lower_summary.find("service") != std::string::npos ||
                lower_summary.find("business logic") != std::string::npos ||
                lower_summary.find("handler") != std::string::npos ||
                lower_directory.find("service") != std::string::npos ||
                lower_filename.find("service") != std::string::npos)) {
                organized["Services & Business Logic"].push_back({file_path, file_info});
                categorized = true;
            }

            // API Routes and Controllers
            if (!categorized && (
                lower_summary.find("controller") != std::string::npos ||
                lower_summary.find("route") != std::string::npos ||
                lower_summary.find("api") != std::string::npos ||
                lower_summary.find("endpoint") != std::string::npos ||
                lower_directory.find("route") != std::string::npos ||
                lower_directory.find("controller") != std::string::npos ||
                lower_directory.find("api") != std::string::npos)) {
                organized["API Routes & Controllers"].push_back({file_path, file_info});
                categorized = true;
            }

            // Algorithms and Computational Logic
            if (!categorized && (
                lower_summary.find("algorithm") != std::string::npos ||
                lower_summary.find("computation") != std::string::npos ||
                lower_summary.find("calculation") != std::string::npos ||
                lower_directory.find("algorithm") != std::string::npos ||
                lower_directory.find("compute") != std::string::npos)) {
                organized["Algorithms & Computations"].push_back({file_path, file_info});
                categorized = true;
            }

            // Utilities and Helpers
            if (!categorized && (
                lower_summary.find("utility") != std::string::npos ||
                lower_summary.find("helper") != std::string::npos ||
                lower_summary.find("util") != std::string::npos ||
                lower_directory.find("util") != std::string::npos ||
                lower_directory.find("helper") != std::string::npos ||
                lower_filename.find("util") != std::string::npos)) {
                organized["Utilities & Helpers"].push_back({file_path, file_info});
                categorized = true;
            }

            // Configuration
            if (!categorized && (
                lower_summary.find("config") != std::string::npos ||
                lower_filename.find("config") != std::string::npos ||
                extension == ".env" || extension == ".yml" ||
                extension == ".yaml" || extension == ".toml" ||
                filename == "docker-compose.yml" || filename == "Dockerfile")) {
                organized["Configuration"].push_back({file_path, file_info});
                categorized = true;
            }

            // Tests
            if (!categorized && (
                lower_summary.find("test") != std::string::npos ||
                lower_directory.find("test") != std::string::npos ||
                lower_filename.find("test") != std::string::npos ||
                lower_filename.find("spec") != std::string::npos)) {
                organized["Tests"].push_back({file_path, file_info});
                categorized = true;
            }

            // Data Processing and Pipeline
            if (!categorized && (
                lower_summary.find("pipeline") != std::string::npos ||
                lower_summary.find("processing") != std::string::npos ||
                lower_summary.find("data processing") != std::string::npos ||
                lower_directory.find("pipeline") != std::string::npos ||
                lower_directory.find("data") != std::string::npos)) {
                organized["Data Pipeline & Processing"].push_back({file_path, file_info});
                categorized = true;
            }

            // If still not categorized, put in "Other Components"
            if (!categorized) {
                organized["Other Components"].push_back({file_path, file_info});
            }
        }

        // Build summary for each category
        int total_files_documented = 0;
        for (const auto& [category, files] : organized) {
            if (files.empty()) continue;

            summary << "### " << category << "\n\n";

            for (const auto& [file_path, file_info] : files) {
                summary << "**" << file_path << "**\n";

                // Add summary if available
                std::string file_summary_text = file_info.value("summary", "");
                if (!file_summary_text.empty()) {
                    summary << "- Summary: " << file_summary_text << "\n";
                } else {
                    summary << "- Summary: Code file (no detailed summary available)\n";
                }

                // Add analysis details if available
                if (file_info.contains("analysis")) {
                    const auto& analysis = file_info["analysis"];

                    // File type and lines
                    if (analysis.contains("type") || analysis.contains("lines")) {
                        summary << "- Type: " << analysis.value("type", "unknown")
                               << " (" << analysis.value("lines", 0) << " lines)\n";
                    }

                    // Functions
                    if (analysis.contains("functions") && !analysis["functions"].empty()) {
                        summary << "- Key Functions: ";
                        int count = 0;
                        for (const auto& func : analysis["functions"]) {
                            if (count++ >= 5) {
                                summary << "...";
                                break;
                            }
                            summary << "`" << func.get<std::string>() << "`";
                            if (count < analysis["functions"].size() && count < 5) {
                                summary << ", ";
                            }
                        }
                        summary << "\n";
                    }

                    // Classes
                    if (analysis.contains("classes") && !analysis["classes"].empty()) {
                        summary << "- Classes: ";
                        int count = 0;
                        for (const auto& cls : analysis["classes"]) {
                            if (count++ >= 5) {
                                summary << "...";
                                break;
                            }
                            summary << "`" << cls.get<std::string>() << "`";
                            if (count < analysis["classes"].size() && count < 5) {
                                summary << ", ";
                            }
                        }
                        summary << "\n";
                    }

                    // Imports/Dependencies
                    if (analysis.contains("imports") && !analysis["imports"].empty()) {
                        summary << "- Dependencies: ";
                        int count = 0;
                        for (const auto& imp : analysis["imports"]) {
                            if (count++ >= 3) {
                                summary << "...";
                                break;
                            }
                            summary << "`" << imp.get<std::string>() << "`";
                            if (count < analysis["imports"].size() && count < 3) {
                                summary << ", ";
                            }
                        }
                        summary << "\n";
                    }
                }

                summary << "\n";
                total_files_documented++;
            }
        }

        // If no files were categorized, return a helpful message
        if (total_files_documented == 0) {
            return "**Note:** No key components were identified in the repository analysis. "
                   "This may indicate that the repository scanning did not capture file summaries, "
                   "or the files don't match common component patterns.\n\n";
        }

        return summary.str();
    }

    // Map doc types from frontend to internal categories
    std::string mapDocumentationType(const std::string& frontend_type) {
        static const std::map<std::string, std::string> type_map = {
            {"internal_api", "api_documentation"},
            {"internal_database", "database_documentation"},
            {"internal_architecture", "architecture_documentation"},
            {"internal_onboarding", "developer_onboarding"},
            {"internal_conventions", "code_conventions"},
            {"internal_technical_spec", "technical_specification"},
            {"external_user_manual", "user_manual"},
            {"external_installation", "installation_guide"},
            {"external_faq", "faq"},
            {"external_troubleshooting", "troubleshooting_guide"},
            {"external_release_notes", "release_notes"},
            {"external_integration", "integration_guide"},
            // Legacy support
            {"internal", "architecture_documentation"},
            {"external", "user_manual"}
        };

        auto it = type_map.find(frontend_type);
        if (it != type_map.end()) {
            return it->second;
        }

        return frontend_type;
    }

public:
    DocumentationService() {
        const char* summaries = std::getenv("SUMMARIES_PATH");
        summaries_path = summaries ? summaries : "./data/summaries";

        // Initialize LLM service
        llm_service = std::make_shared<LLMService>();

        std::cout << "✓ Documentation service initialized with LLM support" << std::endl;

        // Check LLM health
        if (!llm_service->checkHealth()) {
            std::cerr << "⚠️  Warning: LLM service not available. Will use fallback generation." << std::endl;
        }
    }

    // Generate documentation using LLM
    std::string generateDocumentation(
        const std::string& repo_id,
        const std::string& doc_type,
        const std::string& audience = "developers"
    ) {
        std::cout << "📝 Generating " << doc_type << " documentation for repo: " << repo_id << std::endl;

        // Load repository data
        json repo_data = loadRepositoryData(repo_id);

        // Map doc type
        std::string mapped_type = mapDocumentationType(doc_type);

        // Check if LLM is available
        if (!llm_service->checkHealth()) {
            std::cerr << "⚠️  LLM not available, using fallback generation" << std::endl;
            return generateFallbackDocumentation(repo_data, mapped_type, audience);
        }

        try {
            // Build context from repository data
            std::string repo_overview = buildRepositoryOverview(repo_data);
            std::string file_structure = buildFileStructure(repo_data);
            std::string key_files_summary = buildKeyFilesSummary(repo_data);

            // Build prompt
            std::string prompt = PromptTemplates::buildPrompt(
                mapped_type,
                audience,
                repo_overview,
                file_structure,
                key_files_summary
            );

            // Get system prompt
            std::string system_prompt = PromptTemplates::getSystemPrompt(mapped_type);

            std::cout << "🤖 Generating documentation with LLM (this may take 30-60 seconds)..." << std::endl;

            // Generate with LLM
            std::string documentation = llm_service->generate(prompt, system_prompt);

            // Add header with metadata
            std::ostringstream final_doc;
            final_doc << "# Documentation\n\n";
            final_doc << "**Generated:** " << getCurrentTimestamp() << "\n";
            final_doc << "**Type:** " << mapped_type << "\n";
            final_doc << "**Audience:** " << audience << "\n";
            final_doc << "**Repository:** " << repo_id << "\n\n";
            final_doc << "---\n\n";
            final_doc << documentation << "\n\n";
            final_doc << "---\n\n";
            final_doc << "*This documentation was generated using AI assistance. "
                      << "For formal regulatory submissions, please have this reviewed and "
                      << "verified by appropriate personnel.*\n";

            return final_doc.str();

        } catch (const std::exception& e) {
            std::cerr << "❌ LLM generation failed: " << e.what() << std::endl;
            std::cerr << "⚠️  Falling back to basic generation" << std::endl;
            return generateFallbackDocumentation(repo_data, mapped_type, audience);
        }
    }

    // Get LLM service (for accessing system info)
    std::shared_ptr<LLMService> getLLMService() const {
        return llm_service;
    }

private:
    // Fallback documentation generation (enhanced template-based)
    std::string generateFallbackDocumentation(
        const json& repo_data,
        const std::string& doc_type,
        const std::string& audience
    ) {
        std::ostringstream doc;

        // Header with metadata
        doc << "# " << formatDocTypeForDisplay(doc_type) << "\n\n";
        doc << "**Generated:** " << getCurrentTimestamp() << "\n";
        doc << "**Documentation Type:** " << doc_type << "\n";
        doc << "**Target Audience:** " << audience << "\n";
        doc << "**Repository:** " << repo_data.value("repo_name", "Unknown") << "\n\n";
        doc << "---\n\n";

        // Introduction
        doc << "## Introduction\n\n";
        doc << "This documentation provides an overview of the repository structure, "
            << "components, and organization. It is automatically generated from repository analysis.\n\n";

        // Repository Overview
        doc << "## Repository Overview\n\n";
        doc << buildRepositoryOverview(repo_data) << "\n";

        // Technology Stack (inferred from file types)
        doc << "### Technology Stack\n\n";
        doc << buildTechnologyStack(repo_data) << "\n";

        // Repository Structure
        doc << "## Repository Structure\n\n";
        doc << "The following shows the organization of files and directories in the repository:\n\n";
        doc << buildFileStructure(repo_data) << "\n";

        // Key Components
        std::string components_summary = buildKeyFilesSummary(repo_data);
        doc << "## Key Components\n\n";

        if (components_summary.find("**Note:**") != std::string::npos) {
            // No components found
            doc << components_summary;
            doc << "### File Listing\n\n";
            doc << "The repository contains the following files:\n\n";
            doc << buildSimpleFileListing(repo_data) << "\n";
        } else {
            doc << "The repository has been analyzed and organized into the following component categories:\n\n";
            doc << components_summary;
        }

        // Architecture Insights (basic analysis)
        if (doc_type == "architecture_documentation") {
            doc << "## Architecture Insights\n\n";
            doc << buildArchitectureInsights(repo_data) << "\n";
        }

        // Getting Started (for onboarding docs)
        if (doc_type == "developer_onboarding") {
            doc << "## Getting Started\n\n";
            doc << buildGettingStarted(repo_data) << "\n";
        }

        // Footer
        doc << "---\n\n";
        doc << "### About This Documentation\n\n";
        doc << "This is template-based documentation generated from repository structure analysis. ";
        doc << "For more comprehensive, AI-enhanced documentation with detailed explanations, ";
        doc << "architectural decisions, and best practices:\n\n";
        doc << "1. Ensure the LLM service (Ollama) is running\n";
        doc << "2. Verify the model is available (`ollama pull llama3.1:8b`)\n";
        doc << "3. Re-generate the documentation\n\n";
        doc << "*Generated on " << getCurrentTimestamp() << "*\n";

        return doc.str();
    }

    // Helper: Format doc type for display
    std::string formatDocTypeForDisplay(const std::string& doc_type) {
        std::string formatted = doc_type;
        std::replace(formatted.begin(), formatted.end(), '_', ' ');

        // Capitalize first letter of each word
        bool capitalize_next = true;
        for (char& c : formatted) {
            if (capitalize_next && std::isalpha(c)) {
                c = std::toupper(c);
                capitalize_next = false;
            } else if (c == ' ') {
                capitalize_next = true;
            }
        }

        return formatted;
    }

    // Build technology stack from file analysis
    std::string buildTechnologyStack(const json& repo_data) {
        std::ostringstream tech;
        std::map<std::string, int> languages;

        if (repo_data.contains("files")) {
            for (auto& [file_path, file_info] : repo_data["files"].items()) {
                if (file_info.contains("analysis")) {
                    std::string type = file_info["analysis"].value("type", "unknown");
                    languages[type]++;
                }
            }
        }

        if (languages.empty()) {
            tech << "No language information available.\n\n";
            return tech.str();
        }

        tech << "**Languages Detected:**\n\n";
        for (const auto& [lang, count] : languages) {
            tech << "- **" << lang << "**: " << count << " file(s)\n";
        }
        tech << "\n";

        return tech.str();
    }

    // Build simple file listing (fallback when categorization fails)
    std::string buildSimpleFileListing(const json& repo_data) {
        std::ostringstream listing;

        if (!repo_data.contains("files")) {
            return "No files found.\n";
        }

        for (auto& [file_path, file_info] : repo_data["files"].items()) {
            listing << "- **" << file_path << "**";

            if (file_info.contains("analysis")) {
                const auto& analysis = file_info["analysis"];
                std::string type = analysis.value("type", "");
                int lines = analysis.value("lines", 0);

                if (!type.empty() || lines > 0) {
                    listing << " (" << type;
                    if (lines > 0) {
                        listing << ", " << lines << " lines";
                    }
                    listing << ")";
                }
            }
            listing << "\n";
        }

        return listing.str();
    }

    // Build basic architecture insights
    std::string buildArchitectureInsights(const json& repo_data) {
        std::ostringstream insights;

        insights << "### Project Organization\n\n";

        // Count directories
        std::set<std::string> directories;
        if (repo_data.contains("files")) {
            for (auto& [file_path, _] : repo_data["files"].items()) {
                fs::path p(file_path);
                std::string dir = p.parent_path().string();
                if (!dir.empty() && dir != ".") {
                    directories.insert(dir);
                }
            }
        }

        insights << "The project is organized into **" << directories.size() << " directories**, "
                << "containing **" << repo_data.value("analyzed_files", 0) << " files**.\n\n";

        insights << "### Structural Patterns\n\n";
        insights << "Based on the directory structure:\n\n";

        for (const auto& dir : directories) {
            std::string dir_lower = dir;
            std::transform(dir_lower.begin(), dir_lower.end(), dir_lower.begin(), ::tolower);

            insights << "- **" << dir << "**: ";

            if (dir_lower.find("model") != std::string::npos) {
                insights << "Data models and schemas\n";
            } else if (dir_lower.find("service") != std::string::npos) {
                insights << "Business logic and services\n";
            } else if (dir_lower.find("api") != std::string::npos || dir_lower.find("route") != std::string::npos) {
                insights << "API endpoints and routing\n";
            } else if (dir_lower.find("util") != std::string::npos || dir_lower.find("helper") != std::string::npos) {
                insights << "Utility functions and helpers\n";
            } else if (dir_lower.find("test") != std::string::npos) {
                insights << "Test files\n";
            } else if (dir_lower.find("config") != std::string::npos) {
                insights << "Configuration files\n";
            } else if (dir_lower.find("pipeline") != std::string::npos || dir_lower.find("data") != std::string::npos) {
                insights << "Data processing and pipeline components\n";
            } else if (dir_lower.find("algorithm") != std::string::npos) {
                insights << "Algorithms and computational logic\n";
            } else {
                insights << "Component files\n";
            }
        }

        insights << "\n";
        return insights.str();
    }

    // Build getting started section
    std::string buildGettingStarted(const json& repo_data) {
        std::ostringstream getting_started;

        getting_started << "### Prerequisites\n\n";
        getting_started << "Based on the repository analysis, ensure you have the following installed:\n\n";

        // Infer requirements from file types
        std::set<std::string> requirements;
        if (repo_data.contains("files")) {
            for (auto& [file_path, file_info] : repo_data["files"].items()) {
                if (file_info.contains("analysis")) {
                    std::string type = file_info["analysis"].value("type", "");

                    if (type == "python") requirements.insert("- Python 3.x");
                    else if (type == "javascript") requirements.insert("- Node.js and npm");
                    else if (type == "cpp") requirements.insert("- C++ compiler (g++ or clang++)");
                    else if (type == "java") requirements.insert("- Java JDK");
                    else if (type == "go") requirements.insert("- Go");
                    else if (type == "rust") requirements.insert("- Rust and Cargo");
                }

                fs::path p(file_path);
                std::string filename = p.filename().string();
                if (filename == "requirements.txt") requirements.insert("- Python pip");
                if (filename == "package.json") requirements.insert("- Node.js and npm");
                if (filename == "Cargo.toml") requirements.insert("- Rust and Cargo");
                if (filename == "go.mod") requirements.insert("- Go");
                if (filename == "docker-compose.yml" || filename == "Dockerfile") requirements.insert("- Docker");
            }
        }

        for (const auto& req : requirements) {
            getting_started << req << "\n";
        }

        if (requirements.empty()) {
            getting_started << "- Review the repository for specific requirements\n";
        }

        getting_started << "\n### Setup\n\n";
        getting_started << "1. Clone the repository\n";
        getting_started << "2. Review the README.md (if available) for specific setup instructions\n";
        getting_started << "3. Install dependencies\n";
        getting_started << "4. Review configuration files for environment-specific settings\n\n";

        return getting_started.str();
    }
};

#endif // DOCUMENTATION_SERVICE_H
