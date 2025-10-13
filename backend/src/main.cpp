#include "crow_all.h"
#include <iostream>
#include <memory>
#include <string>
#include "services/GitHubService.h"
#include "services/ScannerService.h"
#include "services/DocumentationService.h"

int main() {
    crow::SimpleApp app;

    // Initialize services
    auto github_service = std::make_shared<GitHubService>();
    auto scanner_service = std::make_shared<ScannerService>();
    auto doc_service = std::make_shared<DocumentationService>();

    std::cout << "🚀 Initializing Echo Documentation Generator..." << std::endl;

    // Root endpoint
    CROW_ROUTE(app, "/")
    ([](){
        crow::json::wvalue response;
        response["message"] = "Echo - Automated Documentation Generator";
        response["version"] = "0.1.0";
        response["status"] = "running";
        response["language"] = "C++";
        return response;
    });

    // Health check endpoint
    CROW_ROUTE(app, "/api/health")
    ([](){
        crow::json::wvalue response;
        response["status"] = "healthy";
        response["timestamp"] = std::time(nullptr);
        return response;
    });

    // Add repository endpoint
    CROW_ROUTE(app, "/api/repos/add").methods(crow::HTTPMethod::POST)
    ([&github_service, &scanner_service](const crow::request& req){
        try {
            auto body = crow::json::load(req.body);
            if (!body) {
                crow::json::wvalue error;
                error["error"] = "Invalid JSON";
                return crow::response(400, error);
            }

            std::string github_url = body["github_url"].s();
            std::string branch = body.has("branch") ? body["branch"].s() : "main";

            std::cout << "📥 Cloning repository: " << github_url << std::endl;

            // Clone repository
            auto repo_data = github_service->cloneRepository(github_url, branch);
            
            // Scan repository
            auto scan_results = scanner_service->scanRepository(repo_data["local_path"]);

            crow::json::wvalue response;
            response["status"] = "success";
            response["repo_id"] = repo_data["repo_id"];
            response["files_scanned"] = scan_results["total_files"].get<int>();
            response["message"] = "Repository indexed successfully";
            
            return crow::response(200, response);
        } catch (const std::exception& e) {
            std::cerr << "❌ Error: " << e.what() << std::endl;
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });

    // Get repository summary endpoint
    CROW_ROUTE(app, "/api/repos/<string>/summary")
    ([&scanner_service](const std::string& repo_id){
        try {
            std::cout << "📊 Fetching summary for: " << repo_id << std::endl;
            auto summary = scanner_service->getRepositorySummary(repo_id);
            
            crow::json::wvalue response;
            response["data"] = summary;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            std::cerr << "❌ Error: " << e.what() << std::endl;
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(404, error);
        }
    });

    // Generate documentation endpoint
    CROW_ROUTE(app, "/api/docs/generate").methods(crow::HTTPMethod::POST)
    ([&doc_service](const crow::request& req){
        try {
            auto body = crow::json::load(req.body);
            if (!body) {
                crow::json::wvalue error;
                error["error"] = "Invalid JSON";
                return crow::response(400, error);
            }

            std::string repo_id = body["repo_id"].s();
            std::string doc_type = body["doc_type"].s();
            std::string audience = body.has("audience") ? body["audience"].s() : "developers";

            std::cout << "📝 Generating " << doc_type << " documentation for: " << repo_id << std::endl;

            auto documentation = doc_service->generateDocumentation(repo_id, doc_type, audience);

            crow::json::wvalue response;
            response["status"] = "success";
            response["documentation"] = documentation;
            response["doc_type"] = doc_type;
            response["message"] = doc_type + " documentation generated successfully";
            
            return crow::response(200, response);
        } catch (const std::exception& e) {
            std::cerr << "❌ Error: " << e.what() << std::endl;
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });

    // List all scanned repositories
    CROW_ROUTE(app, "/api/repos/list")
    ([&scanner_service](){
        try {
            auto repos = scanner_service->listRepositories();
            crow::json::wvalue response;
            response["repositories"] = repos;
            response["count"] = repos.size();
            return crow::response(200, response);
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });

    // Start server
    std::cout << "\n✅ Echo server starting on http://0.0.0.0:8000" << std::endl;
    std::cout << "📚 Ready to generate documentation!\n" << std::endl;
    
    app.port(8000)
       .multithreaded()
       .run();

    return 0;
}