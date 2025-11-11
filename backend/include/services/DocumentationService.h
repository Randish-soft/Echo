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

        // Categorize files
        std::map<std::string, std::vector<std::pair<std::string, json>>> organized;

        for (auto& [file_path, file_info] : repo_data["files"].items()) {
            std::string file_summary = file_info.value("summary", "");
            std::string filename = fs::path(file_path).filename().string();

            std::string lower_summary = file_summary;
            std::transform(lower_summary.begin(), lower_summary.end(),
                         lower_summary.begin(), ::tolower);

            // Categorize
            if (lower_summary.find("entry point") != std::string::npos ||
                filename == "main.py" || filename == "app.py" ||
                filename == "index.js" || filename == "main.cpp" ||
                filename == "server.js") {
                organized["entry_points"].push_back({file_path, file_info});
            }
            else if (lower_summary.find("model") != std::string::npos ||
                     lower_summary.find("schema") != std::string::npos) {
                organized["models"].push_back({file_path, file_info});
            }
            else if (lower_summary.find("service") != std::string::npos) {
                organized["services"].push_back({file_path, file_info});
            }
            else if (lower_summary.find("controller") != std::string::npos ||
                     lower_summary.find("route") != std::string::npos ||
                     lower_summary.find("api") != std::string::npos) {
                organized["api_routes"].push_back({file_path, file_info});
            }
            else if (lower_summary.find("config") != std::string::npos) {
                organized["configuration"].push_back({file_path, file_info});
            }
            else if (lower_summary.find("test") != std::string::npos) {
                organized["tests"].push_back({file_path, file_info});
            }
        }

        // Build summary for each category
        for (const auto& [category, files] : organized) {
            if (files.empty()) continue;

            summary << "### " << category << "\n\n";

            for (const auto& [file_path, file_info] : files) {
                summary << "**" << file_path << "**\n";
                summary << "- Summary: " << file_info.value("summary", "No summary") << "\n";

                if (file_info.contains("analysis")) {
                    const auto& analysis = file_info["analysis"];

                    if (analysis.contains("functions") && !analysis["functions"].empty()) {
                        summary << "- Functions: ";
                        int count = 0;
                        for (const auto& func : analysis["functions"]) {
                            if (count++ >= 5) break;
                            summary << func.get<std::string>() << ", ";
                        }
                        summary << "\n";
                    }

                    if (analysis.contains("classes") && !analysis["classes"].empty()) {
                        summary << "- Classes: ";
                        for (const auto& cls : analysis["classes"]) {
                            summary << cls.get<std::string>() << ", ";
                        }
                        summary << "\n";
                    }
                }

                summary << "\n";
            }
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

private:
    // Fallback documentation generation (basic template-based)
    std::string generateFallbackDocumentation(
        const json& repo_data,
        const std::string& doc_type,
        const std::string& audience
    ) {
        std::ostringstream doc;

        doc << "# " << doc_type << " Documentation\n";
        doc << "Generated: " << getCurrentTimestamp() << "\n";
        doc << "Audience: " << audience << "\n\n";
        doc << "---\n\n";

        doc << "## Repository Overview\n\n";
        doc << buildRepositoryOverview(repo_data) << "\n\n";

        doc << "## File Structure\n\n";
        doc << buildFileStructure(repo_data) << "\n\n";

        doc << "## Key Components\n\n";
        doc << buildKeyFilesSummary(repo_data) << "\n\n";

        doc << "---\n\n";
        doc << "*Note: This is basic fallback documentation. "
            << "For enhanced documentation, ensure LLM service is running.*\n";

        return doc.str();
    }
};

#endif // DOCUMENTATION_SERVICE_H
