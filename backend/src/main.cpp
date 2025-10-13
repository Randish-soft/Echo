#include "crow.h"
#include <iostream>
#include <memory>
#include "services/GitHubService.h"
#include "services/ScannerService.h"
#include "services/DocumentationService.h"

int main() {
    crow::SimpleApp app;
    
    // Initialize services
    auto github_service = std::make_shared<GitHubService>();
    auto scanner_service = std::make_shared<ScannerService>();
    auto doc_service = std::make_shared<DocumentationService>();
    
    // Root endpoint
    CROW_ROUTE(app, "/")
    ([](){
        crow::json::wvalue response;
        response["message"] = "Echo - Automated Documentation Generator";
        response["version"] = "0.1.0";
        response["status"] = "running";
        return response;
    });
    
    // Health check
    CROW_ROUTE(app, "/api/health")
    ([](){
        crow::json::wvalue response;
        response["status"] = "healthy";
        return response;
    });
    
    // Add repository endpoint
    CROW_ROUTE(app, "/api/repos/add").methods(crow::HTTPMethod::Post)
    ([&github_service, &scanner_service](const crow::request& req){
        try {
            auto body = crow::json::load(req.body);
            if (!body) {
                return crow::response(400, "Invalid JSON");
            }
            
            std::string github_url = body["github_url"].s();
            std::string branch = body.has("branch") ? body["branch"].s() : "main";
            
            auto repo_data = github_service->cloneRepository(github_url, branch);
            auto scan_results = scanner_service->scanRepository(repo_data["local_path"]);
            
            crow::json::wvalue response;
            response["status"] = "success";
            response["repo_id"] = repo_data["repo_id"];
            response["files_scanned"] = scan_results["total_files"];
            response["message"] = "Repository indexed successfully";
            return crow::response(200, response);
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });
    
    // Get repository summary
    CROW_ROUTE(app, "/api/repos/<string>/summary")
    ([&scanner_service](const std::string& repo_id){
        try {
            auto summary = scanner_service->getRepositorySummary(repo_id);
            return crow::response(200, summary.dump());
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(404, error);
        }
    });
    
    // List all repositories
    CROW_ROUTE(app, "/api/repos")
    ([&scanner_service](){
        try {
            auto repos = scanner_service->listRepositories();
            crow::json::wvalue response;
            response["repositories"] = crow::json::load(repos.dump());
            response["count"] = repos.size();
            return crow::response(200, response);
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });
    
    // Generate documentation
    CROW_ROUTE(app, "/api/docs/generate").methods(crow::HTTPMethod::Post)
    ([&doc_service](const crow::request& req){
        try {
            auto body = crow::json::load(req.body);
            if (!body) {
                return crow::response(400, "Invalid JSON");
            }
            
            std::string repo_id = body["repo_id"].s();
            std::string doc_type = body["doc_type"].s();
            std::string audience = body.has("audience") ? body["audience"].s() : "developers";
            
            auto documentation = doc_service->generateDocumentation(repo_id, doc_type, audience);
            
            crow::json::wvalue response;
            response["status"] = "success";
            response["documentation"] = documentation;
            response["message"] = doc_type + " documentation generated";
            return crow::response(200, response);
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = e.what();
            return crow::response(500, error);
        }
    });
    
    std::cout << "🚀 Echo server starting on port 8000..." << std::endl;
    app.port(8000).multithreaded().run();
    
    return 0;
}
