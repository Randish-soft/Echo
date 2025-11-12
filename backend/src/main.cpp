#include "crow.h"
#include <iostream>
#include <memory>
#include <chrono>
#include <ctime>
#include "services/GitHubService.h"
#include "services/ScannerService.h"
#include "services/DocumentationService.h"

// Logging helper function
void logRequest(const std::string& method, const std::string& path) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::cout << "[" << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S") 
              << "] " << method << " " << path << std::endl;
}

// Error logging helper
void logError(const std::string& context, const std::exception& e) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::cerr << "[ERROR] [" << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S") 
              << "] " << context << ": " << e.what() << std::endl;
}

// Custom middleware for CORS
struct CORSHandler {
    struct context {};
    
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Add CORS headers to all responses
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
        res.add_header("Access-Control-Max-Age", "3600");
        
        // Handle OPTIONS requests
        if (req.method == crow::HTTPMethod::Options) {
            res.code = 204;
            res.end();
        }
    }
    
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Ensure CORS headers are always present
        if (res.headers.find("Access-Control-Allow-Origin") == res.headers.end()) {
            res.add_header("Access-Control-Allow-Origin", "*");
        }
    }
};

int main() {
    try {
        // Use App with middleware
        crow::App<CORSHandler> app;
        
        std::cout << "========================================" << std::endl;
        std::cout << "         Echo Documentation System      " << std::endl;
        std::cout << "========================================" << std::endl;
        std::cout << "Initializing services..." << std::endl;
        
        // Initialize services with error handling
        std::shared_ptr<GitHubService> github_service;
        std::shared_ptr<ScannerService> scanner_service;
        std::shared_ptr<DocumentationService> doc_service;
        
        try {
            github_service = std::make_shared<GitHubService>();
            scanner_service = std::make_shared<ScannerService>();
            doc_service = std::make_shared<DocumentationService>();
            std::cout << "✅ All services initialized successfully" << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "❌ Failed to initialize services: " << e.what() << std::endl;
            return 1;
        }
        
        // Root endpoint
        CROW_ROUTE(app, "/")
        ([](){
            logRequest("GET", "/");
            crow::json::wvalue response;
            response["message"] = "Echo - Automated Documentation Generator";
            response["version"] = "0.1.0";
            response["status"] = "running";
            response["endpoints"] = crow::json::wvalue::object();
            response["endpoints"]["/api/health"] = "Health check endpoint";
            response["endpoints"]["/api/system/info"] = "Get system specs and selected model";
            response["endpoints"]["/api/repos/add"] = "Add new repository (POST)";
            response["endpoints"]["/api/repos"] = "List all repositories";
            response["endpoints"]["/api/repos/<id>/summary"] = "Get repository summary";
            response["endpoints"]["/api/docs/generate"] = "Generate documentation (POST)";
            return response;
        });
        
        // Health check endpoint
        CROW_ROUTE(app, "/api/health")
        ([](){
            logRequest("GET", "/api/health");
            crow::json::wvalue response;
            response["status"] = "healthy";
            response["timestamp"] = std::chrono::system_clock::now().time_since_epoch().count();
            return response;
        });

        // System info endpoint - shows detected system specs and selected model
        CROW_ROUTE(app, "/api/system/info")
        ([&doc_service](){
            logRequest("GET", "/api/system/info");

            try {
                auto llm_service = doc_service->getLLMService();
                if (!llm_service) {
                    crow::json::wvalue error;
                    error["error"] = "LLM service not available";
                    return crow::response(503, error);
                }

                auto specs = llm_service->getSystemSpecs();
                auto model_config = llm_service->getModelConfig();
                auto available_models = llm_service->getAvailableModels();

                crow::json::wvalue response;
                response["status"] = "success";

                // System specifications
                response["system"]["platform"] = specs.platform;
                response["system"]["cpu_brand"] = specs.cpu_brand;
                response["system"]["cpu_cores"] = specs.cpu_cores;
                response["system"]["total_ram_gb"] = specs.total_ram_gb;
                response["system"]["available_ram_gb"] = specs.available_ram_gb;
                response["system"]["gpu_type"] = specs.gpu_type;
                response["system"]["has_metal"] = specs.has_metal;
                response["system"]["has_cuda"] = specs.has_cuda;

                // Selected model
                response["selected_model"]["name"] = model_config.model_name;
                response["selected_model"]["display_name"] = model_config.display_name;
                response["selected_model"]["tier"] = model_config.tier;
                response["selected_model"]["description"] = model_config.description;
                response["selected_model"]["estimated_time_sec"] = model_config.estimated_time_sec;
                response["selected_model"]["context_length"] = model_config.context_length;
                response["selected_model"]["num_predict"] = model_config.num_predict;

                // Available models
                crow::json::wvalue::list models_list;
                for (const auto& model : available_models) {
                    crow::json::wvalue m;
                    m["name"] = model.model_name;
                    m["display_name"] = model.display_name;
                    m["tier"] = model.tier;
                    m["description"] = model.description;
                    m["min_ram_gb"] = model.min_ram_gb;
                    m["min_cores"] = model.min_cores;
                    m["recommended_ram_gb"] = model.recommended_ram_gb;
                    m["recommended_cores"] = model.recommended_cores;
                    m["estimated_time_sec"] = model.estimated_time_sec;
                    models_list.push_back(std::move(m));
                }
                response["available_models"] = std::move(models_list);

                return crow::response(200, response);

            } catch (const std::exception& e) {
                logError("System info", e);
                crow::json::wvalue error;
                error["error"] = "Failed to retrieve system information";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });

        // Add repository endpoint
        CROW_ROUTE(app, "/api/repos/add").methods(crow::HTTPMethod::Post)
        ([&github_service, &scanner_service](const crow::request& req){
            logRequest("POST", "/api/repos/add");
            
            try {
                // Parse JSON body
                auto body = crow::json::load(req.body);
                if (!body) {
                    std::cerr << "❌ Invalid JSON received" << std::endl;
                    crow::json::wvalue error;
                    error["error"] = "Invalid JSON format";
                    error["details"] = "Request body must be valid JSON";
                    return crow::response(400, error);
                }
                
                // Validate required fields
                if (!body.has("github_url")) {
                    crow::json::wvalue error;
                    error["error"] = "Missing required field";
                    error["details"] = "github_url is required";
                    return crow::response(400, error);
                }
                
                // Extract parameters
                std::string github_url = body["github_url"].s();
                std::string branch;
                if (body.has("branch")) {
                    branch = body["branch"].s();
                } else {
                    branch = "main";
                }
                
                std::cout << "📦 Processing repository: " << github_url << " (branch: " << branch << ")" << std::endl;
                
                // Clone repository
                std::map<std::string, std::string> repo_data;
                try {
                    repo_data = github_service->cloneRepository(github_url, branch);
                } catch (const std::exception& e) {
                    logError("Repository cloning", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to clone repository";
                    error["details"] = e.what();
                    return crow::response(500, error);
                }
                
                // Scan repository
                nlohmann::json scan_results;
                try {
                    scan_results = scanner_service->scanRepository(repo_data["local_path"]);
                } catch (const std::exception& e) {
                    logError("Repository scanning", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to scan repository";
                    error["details"] = e.what();
                    return crow::response(500, error);
                }
                
                // Prepare success response
                crow::json::wvalue response;
                response["status"] = "success";
                response["repo_id"] = repo_data["repo_id"];
                response["files_scanned"] = scan_results["total_files"].get<int>();
                response["analyzed_files"] = scan_results["analyzed_files"].get<int>();
                response["message"] = "Repository indexed successfully";
                
                std::cout << "✅ Successfully indexed repository: " << repo_data["repo_id"] << std::endl;
                return crow::response(200, response);
                
            } catch (const std::exception& e) {
                logError("Add repository endpoint", e);
                crow::json::wvalue error;
                error["error"] = "Internal server error";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });
        
        // Get repository summary endpoint
        CROW_ROUTE(app, "/api/repos/<string>/summary")
        ([&scanner_service](const std::string& repo_id){
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
                return crow::response(404, error);
            }
        });
        
        // List all repositories endpoint
        CROW_ROUTE(app, "/api/repos")
        ([&scanner_service](){
            logRequest("GET", "/api/repos");
            
            try {
                std::cout << "📂 Listing all repositories" << std::endl;
                
                auto repos = scanner_service->listRepositories();
                
                crow::json::wvalue response;
                response["status"] = "success";
                
                // Convert nlohmann::json array to crow::json array
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
        
        // Generate documentation endpoint
        CROW_ROUTE(app, "/api/docs/generate").methods(crow::HTTPMethod::Post)
        ([&doc_service](const crow::request& req){
            logRequest("POST", "/api/docs/generate");
            
            try {
                // Parse JSON body
                auto body = crow::json::load(req.body);
                if (!body) {
                    std::cerr << "❌ Invalid JSON received" << std::endl;
                    crow::json::wvalue error;
                    error["error"] = "Invalid JSON format";
                    error["details"] = "Request body must be valid JSON";
                    return crow::response(400, error);
                }
                
                // Validate required fields
                if (!body.has("repo_id") || !body.has("doc_type")) {
                    crow::json::wvalue error;
                    error["error"] = "Missing required fields";
                    error["details"] = "repo_id and doc_type are required";
                    return crow::response(400, error);
                }
                
                // Extract parameters
                std::string repo_id = body["repo_id"].s();
                std::string doc_type = body["doc_type"].s();
                std::string audience;
                if (body.has("audience")) {
                    audience = body["audience"].s();
                } else {
                    audience = "developers";
                }
                
                // Validate doc_type - accept detailed types (internal_*, external_*) or legacy (internal, external)
                bool valid_type = (doc_type == "internal" || doc_type == "external" ||
                                   doc_type.rfind("internal_", 0) == 0 ||
                                   doc_type.rfind("external_", 0) == 0);

                if (!valid_type) {
                    crow::json::wvalue error;
                    error["error"] = "Invalid documentation type";
                    error["details"] = "doc_type must start with 'internal_' or 'external_' (e.g., 'internal_api', 'external_user_manual')";
                    return crow::response(400, error);
                }
                
                std::cout << "📝 Generating " << doc_type << " documentation for: " << repo_id 
                          << " (audience: " << audience << ")" << std::endl;
                
                // Generate documentation
                std::string documentation;
                try {
                    documentation = doc_service->generateDocumentation(repo_id, doc_type, audience);
                } catch (const std::exception& e) {
                    logError("Documentation generation", e);
                    crow::json::wvalue error;
                    error["error"] = "Failed to generate documentation";
                    error["details"] = e.what();
                    return crow::response(500, error);
                }
                
                // Prepare success response
                crow::json::wvalue response;
                response["status"] = "success";
                response["documentation"] = documentation;
                response["message"] = doc_type + " documentation generated";
                response["repo_id"] = repo_id;
                response["doc_type"] = doc_type;
                response["audience"] = audience;
                
                std::cout << "✅ Successfully generated " << doc_type << " documentation" << std::endl;
                return crow::response(200, response);
                
            } catch (const std::exception& e) {
                logError("Generate documentation endpoint", e);
                crow::json::wvalue error;
                error["error"] = "Internal server error";
                error["details"] = e.what();
                return crow::response(500, error);
            }
        });
        
        // 404 handler for undefined routes
        CROW_CATCHALL_ROUTE(app)
        ([](){
            crow::json::wvalue error;
            error["error"] = "Not Found";
            error["details"] = "The requested endpoint does not exist";
            return crow::response(404, error);
        });
        
        // Start server
        std::cout << "========================================" << std::endl;
        std::cout << "🚀 Echo server starting on port 8000..." << std::endl;
        std::cout << "🌐 Access at: http://localhost:8000" << std::endl;
        std::cout << "========================================" << std::endl;
        
        app.port(8000).multithreaded().run();
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Fatal error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}