#ifndef GITHUB_SERVICE_H
#define GITHUB_SERVICE_H

#include <string>
#include <map>
#include <vector>
#include <fstream>
#include <filesystem>
#include <openssl/md5.h>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <iomanip>

namespace fs = std::filesystem;

class GitHubService {
private:
    std::string base_path;
    std::string github_token;

    // Generate unique repository ID from URL using MD5
    std::string generateRepoId(const std::string& url) {
        unsigned char digest[MD5_DIGEST_LENGTH];
        MD5(reinterpret_cast<const unsigned char*>(url.c_str()), url.length(), digest);
        
        std::ostringstream md5string;
        for(int i = 0; i < MD5_DIGEST_LENGTH; ++i) {
            md5string << std::hex << std::setw(2) << std::setfill('0') 
                     << static_cast<int>(digest[i]);
        }
        
        return md5string.str().substr(0, 12);
    }

    // Parse GitHub URL to extract owner and repo name
    std::map<std::string, std::string> parseGitHubUrl(const std::string& url) {
        std::map<std::string, std::string> result;
        std::string clean_url = url;
        
        // Remove .git suffix if present
        if (clean_url.length() >= 4 && 
            clean_url.substr(clean_url.length() - 4) == ".git") {
            clean_url = clean_url.substr(0, clean_url.length() - 4);
        }
        
        // Remove https://github.com/ prefix
        size_t pos = clean_url.find("github.com/");
        if (pos != std::string::npos) {
            clean_url = clean_url.substr(pos + 11);
        }
        
        // Split owner and repo
        pos = clean_url.find('/');
        if (pos != std::string::npos) {
            result["owner"] = clean_url.substr(0, pos);
            result["repo"] = clean_url.substr(pos + 1);
            
            // Remove any trailing slashes or query parameters
            size_t query_pos = result["repo"].find('?');
            if (query_pos != std::string::npos) {
                result["repo"] = result["repo"].substr(0, query_pos);
            }
        }
        
        return result;
    }

public:
    GitHubService() {
        // Get GitHub token from environment
        const char* token = std::getenv("GITHUB_TOKEN");
        if (token) {
            github_token = token;
            std::cout << "✓ GitHub token loaded" << std::endl;
        } else {
            std::cout << "⚠ No GitHub token found (public repos only)" << std::endl;
        }
        
        // Get repos path from environment or use default
        const char* repos_path = std::getenv("REPOS_PATH");
        base_path = repos_path ? repos_path : "./data/repositories";
        
        // Create base directory if it doesn't exist
        fs::create_directories(base_path);
        std::cout << "✓ Repository storage path: " << base_path << std::endl;
    }

    // Clone a GitHub repository
    std::map<std::string, std::string> cloneRepository(
        const std::string& github_url, 
        const std::string& branch = "main"
    ) {
        std::map<std::string, std::string> metadata;
        
        std::string repo_id = generateRepoId(github_url);
        std::string local_path = base_path + "/" + repo_id;
        
        metadata["repo_id"] = repo_id;
        metadata["github_url"] = github_url;
        metadata["local_path"] = local_path;
        metadata["branch"] = branch;
        
        // Check if already cloned
        if (fs::exists(local_path)) {
            std::cout << "📁 Repository already exists at: " << local_path << std::endl;
            std::cout << "🔄 Pulling latest changes..." << std::endl;
            
            std::string pull_cmd = "cd " + local_path + " && git pull origin " + branch + " 2>&1";
            int result = system(pull_cmd.c_str());
            
            if (result != 0) {
                std::cout << "⚠ Warning: Failed to pull latest changes" << std::endl;
            }
        } else {
            std::cout << "📥 Cloning repository..." << std::endl;
            std::cout << "   URL: " << github_url << std::endl;
            std::cout << "   Branch: " << branch << std::endl;
            std::cout << "   Destination: " << local_path << std::endl;
            
            std::string clone_cmd = "git clone --depth 1 --branch " + branch + 
                                   " " + github_url + " " + local_path + " 2>&1";
            
            int result = system(clone_cmd.c_str());
            
            if (result != 0) {
                throw std::runtime_error("Failed to clone repository. Check URL and branch name.");
            }
            
            std::cout << "✅ Repository cloned successfully!" << std::endl;
        }
        
        // Parse URL for metadata
        auto repo_info = parseGitHubUrl(github_url);
        metadata["owner"] = repo_info["owner"];
        metadata["repo_name"] = repo_info["repo"];
        
        return metadata;
    }

    // Read .gitignore patterns
    std::vector<std::string> getGitignorePatterns(const std::string& local_path) {
        std::vector<std::string> patterns;
        std::string gitignore_path = local_path + "/.gitignore";
        
        if (fs::exists(gitignore_path)) {
            std::ifstream file(gitignore_path);
            std::string line;
            
            while (std::getline(file, line)) {
                // Trim whitespace
                line.erase(0, line.find_first_not_of(" \t\r\n"));
                line.erase(line.find_last_not_of(" \t\r\n") + 1);
                
                // Skip empty lines and comments
                if (!line.empty() && line[0] != '#') {
                    patterns.push_back(line);
                }
            }
            file.close();
            
            std::cout << "✓ Loaded " << patterns.size() << " patterns from .gitignore" << std::endl;
        }
        
        // Add default patterns to ignore
        patterns.push_back(".git");
        patterns.push_back("__pycache__");
        patterns.push_back("node_modules");
        patterns.push_back("venv");
        patterns.push_back(".env");
        patterns.push_back("build");
        patterns.push_back("dist");
        patterns.push_back(".next");
        
        return patterns;
    }
};

#endif // GITHUB_SERVICE_H