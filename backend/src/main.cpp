#include "crow.h"

#include <chrono>
#include <ctime>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

#include "services/DocumentationService.h"
#include "services/GitHubService.h"
#include "services/ScannerService.h"

// ------------------------------
// Logging helpers
// ------------------------------
void logRequest(const std::string& method, const std::string& path) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::cout << "[" << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S")
              << "] " << method << " " << path << std::endl;
}

void logError(const std::string& context, const std::exception& e) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::cerr << "[ERROR] [" << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S")
              << "] " << context << ": " << e.what() << std::endl;
}

// ------------------------------
// Enhanced CORS middleware
// ------------------------------
struct CORSHandler {
    struct context {};

    void before_handle(crow::request& req, crow::response& res, context&) {
        // Get the Origin header from the request
        std::string origin = req.get_header_value("Origin");
        
        // Define allowed origins
        std::vector<std::string> allowed_origins = {
            "http://localhost:3000",
            "http://127.0.0.1:3000", 
            "http://frontend:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        };
        
        // Check if the request origin is allowed
        bool origin_allowed = false;
        if (!origin.empty()) {
            for (const auto& allowed : allowed_origins) {
                if (origin == allowed) {
                    origin_allowed = true;
                    break;
                }
            }
        }
        
        // If origin is not allowed or empty, use the first allowed origin
        if (!origin_allowed) {
            origin = allowed_origins[0];
        }
        
        res.add_header("Access-Control-Allow-Origin", origin);
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key");
        res.add_header("Access-Control-Allow-Credentials", "true");
        res.add_header("Access-Control-Max-Age", "3600");
        res.add_header("Vary", "Origin");

        // Handle preflight requests
        if (req.method == crow::HTTPMethod::Options) {
            res.code = 204; // No Content
            res.end();
        }
    }

    void after_handle(crow::request& req, crow::response& res, context&) {
        // Ensure CORS headers are always present in the response
        if (res.headers.find("Access-Control-Allow-Origin") == res.headers.end()) {
            std::string origin = req.get_header_value("Origin");
            std::vector<std::string> allowed_origins = {
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://frontend:3000"
            };
            
            if (origin.empty() || 
                std::find(allowed_origins.begin(), allowed_origins.end(), origin) == allowed_origins.end()) {
                origin = allowed_origins[0];
            }
            
            res.add_header("Access-Control-Allow-Origin", origin);
        }
    }
};

// ------------------------------
// Secret/env loader
// ------------------------------
static std::string read_env_or_file(const char* env_key, const char* file_env_key) {
    if (const char* v = std::getenv(env_key); v && *v) return std::string(v);
    if (const char* p = std::getenv(file_env_key); p && *p) {
        std::ifstream f(p);
        if (f) {
            std::ostringstream ss;
            ss << f.rdbuf();
            std::string val = ss.str();
            // Trim trailing whitespace/newlines
            while (!val.empty() && (val.back() == '\n' || val.back() == '\r' || val.back() == ' ' || val.back() == '\t'))
                val.pop_back();
            return val;
        }
    }
    return {};
}

// ------------------------------
// Environment variable helpers
// ------------------------------
std::string getEnvironmentVariable(const std::string& key, const std::string& defaultValue = "") {
    const char* value = std::getenv(key.c_str());
    return (value && *value) ? std::string(value) : defaultValue;
}

// ------------------------------
// Service initialization helper
// ------------------------------
bool initializeServices(std::shared_ptr<GitHubService>& github_service,
                       std::shared_ptr<ScannerService>& scanner_service, 
                       std::shared_ptr<DocumentationService>& doc_service) {
    try {
        std::cout << "🔧 Initializing GitHub Service..." << std::endl;
        github_service = std::make_shared<GitHubService>();
        std::cout << "✅ GitHub Service initialized" << std::endl;

        std::cout << "🔧 Initializing Scanner Service..." << std::endl;
        scanner_service = std::make_shared<ScannerService>();
        std::cout << "✅ Scanner Service initialized" << std::endl;

        std::cout << "🔧 Initializing Documentation Service..." << std::endl;
        doc_service = std::make_shared<DocumentationService>();
        std::cout << "✅ Documentation Service initialized" << std::endl;

        return true;
    } catch (const std::exception& e) {
        std::cerr << "❌ Service initialization failed: " << e.what() << std::endl;
        return false;
    }
}

int main() {
    try {
        crow::App<CORSHandler> app;

        std::cout << "========================================" << std::endl;
        std::cout << "         Echo Documentation System      " << std::endl;
        std::cout << "========================================" << std::endl;

        // ------------------------------
        // Load GitHub token securely
        // ------------------------------
        const std::string token = read_env_or_file("GITHUB_TOKEN", "GITHUB_TOKEN_FILE");
        if (token.empty()) {
            std::cerr
                << "❌ GITHUB_TOKEN not found.\n"
                << "   Provide one of the following before starting the backend:\n"
                << "   - Environment variable: GITHUB_TOKEN\n"
                << "   - Or set GITHUB_TOKEN_FILE to a readable file path containing the token\n"
                << "   (Tip: Create a .env file with GITHUB_TOKEN=your_token)\n";
            return 1;
        }
        
        // Set the token for downstream services
        setenv("GITHUB_TOKEN", token.c_str(), 1);
        std::cout << "🔑 GitHub token loaded successfully" << std::endl;

        // ------------------------------
        // Display configuration
        // ------------------------------
        std::cout << "📊 Configuration:" << std::endl;
        std::cout << "   - Repositories path: " << getEnvironmentVariable("REPOS_PATH", "/app/data/repositories") << std::endl;
        std::cout << "   - Summaries path: " << getEnvironmentVariable("SUMMARIES_PATH", "/app/data/summaries") << std::endl;
        std::cout << "   - Database URL: " << getEnvironmentVariable("DATABASE_URL", "postgresql://postgres:password@db:5432/echo_db") << std::endl;
        std::cout << "   - CORS Origins: " << getEnvironmentVariable("CORS_ORIGIN", "http://localhost:3000") << std::endl;

        // ------------------------------
        // Initialize services
        // ------------------------------
        std::cout << "\n🚀 Initializing services..." << std::endl;
        
        std::shared_ptr<GitHubService> github_service;
        std::shared_ptr<ScannerService> scanner_service;
        std::shared_ptr<DocumentationService> doc_service;

        if (!initializeServices(github_service, scanner_service, doc_service)) {
            return 1;
        }

        std::cout << "✅ All services initialized successfully" << std::endl;

        // ------------------------------
        // API Routes
        // ------------------------------

        // Root endpoint
        CROW_ROUTE(app, "/")
        ([]() {
            logRequest("GET", "/");
            crow::json::wvalue response;
            response["message"] = "Echo - Automated Documentation Generator";
            response["version"] = "1.0.0";
            response["status"] = "running";
            response["timestamp"] = std::chrono::system_clock::now().time_since_epoch().count();
            
            // API documentation
            response["endpoints"] = crow::json::wvalue::object();
            response["endpoints"]["/api/health"] = "Health check endpoint";
            response["endpoints"]["/api/repos/add"] = "Add new repository (POST)";
            response["endpoints"]["/api/repos"] = "List all repositories (GET)";
            response["endpoints"]["/api/repos/<id>/summary"] = "Get repository summary (GET)";
            response["endpoints"]["/api/docs/generate"] = "Generate documentation (POST)";
            
            return response;
        });

        // Health check
        CROW_ROUTE(app, "/api/health")
        ([]() {
            logRequest("GET", "/api/health");
            crow::json::wvalue response;
            response["status"] = "healthy";
            response["service"] = "echo-backend";
            response["timestamp"] = std::chrono::system_clock::now().time_since_epoch().count();
            response["version"] = "1.0.0";
            return response;
        });

        // Add repository
        CROW_ROUTE(app, "/api/repos/add").methods(crow::HTTPMethod::Post)
        ([&github_service, &scanner_service](const crow::request& req) {
            logRequest("POST", "/api/repos/add");

            try {
                auto body = crow::json::load(req.body);
                if (!body) {
                    std::cerr << "❌ Invalid JSON received" << std::endl;
                    crow::json::wvalue error;
                    error["error"] = "Invalid JSON format";
                    error["details"] = "Request body must be valid JSON";
                    return crow::response(400, error);
                }

                if (!body.has("github_url")) {
                    crow::json::wvalue error;
                    error["error"] = "Missing required field";
                    error["details"] = "github_url is required";
                    return crow::response(400, error);
                }

                std::string github_url = body["github_url"].s();
                // FIX: Use explicit string conversion to avoid type mismatch
                std::string branch = "main";
                if (body.has("branch")) {
                    branch = std::string(body["branch"].s());
                }

                std::cout << "📦 Processing repository: " << github_url
                          << " (branch: " << branch << ")" << std::endl;

                // Clone repository
                std::map<std::string, std::string> repo_data;
                try {
                    repo_data = github_service->cloneRepository(github_url, branch);
                    std::cout << "✅ Repository cloned: " << repo_data["repo_id"] << std::endl;
                } catch (const std::exception& e) {
                    logError("Repository cloning", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to clone repository";
                    error["details"] = e.what();
                    error["suggestion"] = "Check the repository URL, branch name, and GitHub token permissions";
                    return crow::response(500, error);
                }

                // Scan repository
                nlohmann::json scan_results;
                try {
                    scan_results = scanner_service->scanRepository(repo_data["local_path"]);
                    std::cout << "✅ Repository scanned: " << scan_results["total_files"].get<int>() << " files" << std::endl;
                } catch (const std::exception& e) {
                    logError("Repository scanning", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to scan repository";
                    error["details"] = e.what();
                    return crow::response(500, error);
                }

                // Success response
                crow::json::wvalue response;
                response["status"] = "success";
                response["repo_id"] = repo_data["repo_id"];
                response["files_scanned"] = scan_results["total_files"].get<int>();
                response["analyzed_files"] = scan_results["analyzed_files"].get<int>();
                response["message"] = "Repository indexed successfully";
                response["local_path"] = repo_data["local_path"];

                std::cout << "🎉 Successfully indexed repository: " << repo_data["repo_id"] << std::endl;
                return crow::response(201, response); // 201 Created

            } catch (const std::exception& e) {
                logError("Add repository endpoint", e);
                crow::json::wvalue error;
                error["error"] = "Internal server error";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });

        // Get repository summary
        CROW_ROUTE(app, "/api/repos/<string>/summary")
        ([&scanner_service](const std::string& repo_id) {
            logRequest("GET", "/api/repos/" + repo_id + "/summary");

            try {
                std::cout << "📋 Fetching summary for repository: " << repo_id << std::endl;

                auto summary = scanner_service->getRepositorySummary(repo_id);

                crow::response res(200, summary.dump());
                res.add_header("Content-Type", "application/json");
                return res;

            } catch (const std::exception& e) {
                logError("Get repository summary", e);
                crow::json::wvalue error;
                error["error"] = "Repository not found";
                error["details"] = e.what();
                error["repo_id"] = repo_id;
                error["suggestion"] = "Check if the repository exists and has been properly indexed";
                return crow::response(404, error);
            }
        });

        // List repositories
        CROW_ROUTE(app, "/api/repos")
        ([&scanner_service]() {
            logRequest("GET", "/api/repos");

            try {
                std::cout << "📂 Listing all repositories" << std::endl;

                auto repos = scanner_service->listRepositories();

                crow::json::wvalue response;
                response["status"] = "success";

                std::vector<crow::json::wvalue> repo_list;
                for (const auto& repo : repos) {
                    repo_list.push_back(crow::json::wvalue(repo.get<std::string>()));
                }
                response["repositories"] = std::move(repo_list);
                response["count"] = static_cast<int>(repos.size());

                std::cout << "✅ Found " << repos.size() << " repositories" << std::endl;
                return crow::response(200, response);

            } catch (const std::exception& e) {
                logError("List repositories", e);
                crow::json::wvalue error;
                error["error"] = "Failed to list repositories";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });

        // Generate documentation
        CROW_ROUTE(app, "/api/docs/generate").methods(crow::HTTPMethod::Post)
        ([&doc_service](const crow::request& req) {
            logRequest("POST", "/api/docs/generate");

            try {
                auto body = crow::json::load(req.body);
                if (!body) {
                    std::cerr << "❌ Invalid JSON received" << std::endl;
                    crow::json::wvalue error;
                    error["error"] = "Invalid JSON format";
                    error["details"] = "Request body must be valid JSON";
                    return crow::response(400, error);
                }

                if (!body.has("repo_id") || !body.has("doc_type")) {
                    crow::json::wvalue error;
                    error["error"] = "Missing required fields";
                    error["details"] = "repo_id and doc_type are required";
                    return crow::response(400, error);
                }

                std::string repo_id = body["repo_id"].s();
                std::string doc_type = body["doc_type"].s();
                // FIX: Use explicit string conversion to avoid type mismatch
                std::string audience = "developers";
                if (body.has("audience")) {
                    audience = std::string(body["audience"].s());
                }

                if (doc_type != "internal" && doc_type != "external") {
                    crow::json::wvalue error;
                    error["error"] = "Invalid documentation type";
                    error["details"] = "doc_type must be 'internal' or 'external'";
                    return crow::response(400, error);
                }

                std::cout << "📝 Generating " << doc_type << " documentation for: " << repo_id
                          << " (audience: " << audience << ")" << std::endl;

                std::string documentation;
                try {
                    documentation = doc_service->generateDocumentation(repo_id, doc_type, audience);
                    std::cout << "✅ Documentation generated successfully" << std::endl;
                } catch (const std::exception& e) {
                    logError("Documentation generation", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to generate documentation";
                    error["details"] = e.what();
                    error["suggestion"] = "Ensure the repository has been properly scanned and contains readable code files";
                    return crow::response(500, error);
                }

                crow::json::wvalue response;
                response["status"] = "success";
                response["documentation"] = documentation;
                response["message"] = doc_type + " documentation generated";
                response["repo_id"] = repo_id;
                response["doc_type"] = doc_type;
                response["audience"] = audience;
                response["length"] = documentation.length();

                std::cout << "🎉 Successfully generated " << doc_type << " documentation (" 
                          << documentation.length() << " characters)" << std::endl;
                return crow::response(200, response);

            } catch (const std::exception& e) {
                logError("Generate documentation endpoint", e);
                crow::json::wvalue error;
                error["error"] = "Internal server error";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });

        // 404 catch-all
        CROW_CATCHALL_ROUTE(app)
        ([](const crow::request& req) {
            logRequest(crow::method_name(req.method), req.url);
            crow::json::wvalue error;
            error["error"] = "Endpoint not found";
            error["details"] = "The requested endpoint does not exist";
            error["path"] = req.url;
            error["method"] = crow::method_name(req.method);
            return crow::response(404, error);
        });

        // ------------------------------
        // Start server
        // ------------------------------
        std::cout << "\n========================================" << std::endl;
        std::cout << "🚀 Echo server starting on port 8000..." << std::endl;
        std::cout << "🌐 API Base: http://localhost:8000" << std::endl;
        std::cout << "📚 API Docs: http://localhost:8000/" << std::endl;
        std::cout << "🔧 Environment: " << getEnvironmentVariable("NODE_ENV", "development") << std::endl;
        std::cout << "========================================" << std::endl;

        // Set log level to reduce noise (optional)
        app.loglevel(crow::LogLevel::Warning);
        
        app.port(8000).multithreaded().run();

    } catch (const std::exception& e) {
        std::cerr << "❌ Fatal error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}