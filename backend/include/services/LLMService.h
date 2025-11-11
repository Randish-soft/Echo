#ifndef LLM_SERVICE_H
#define LLM_SERVICE_H

#include <string>
#include <iostream>
#include <sstream>
#include <nlohmann/json.hpp>
#include <curl/curl.h>
#include <memory>

using json = nlohmann::json;

class LLMService {
private:
    std::string ollama_host;
    std::string model_name;

    // Callback for CURL to write response data
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
        size_t total_size = size * nmemb;
        userp->append((char*)contents, total_size);
        return total_size;
    }

    // Make HTTP POST request to Ollama API
    std::string makeRequest(const std::string& endpoint, const json& payload) {
        CURL* curl = curl_easy_init();
        if (!curl) {
            throw std::runtime_error("Failed to initialize CURL");
        }

        std::string response_data;
        std::string url = ollama_host + endpoint;
        std::string json_payload = payload.dump();

        // Set up CURL options
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, json_payload.length());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_data);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 300L); // 5 minute timeout for LLM generation

        // Set headers
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        // Perform request
        CURLcode res = curl_easy_perform(curl);

        // Check for errors
        if (res != CURLE_OK) {
            std::string error = "CURL request failed: " + std::string(curl_easy_strerror(res));
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            throw std::runtime_error(error);
        }

        // Check HTTP response code
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (http_code != 200) {
            throw std::runtime_error("HTTP error: " + std::to_string(http_code));
        }

        return response_data;
    }

public:
    LLMService() {
        // Get Ollama host from environment or use default
        const char* host = std::getenv("OLLAMA_HOST");
        ollama_host = host ? host : "http://localhost:11434";

        // Default model - can be configured later
        model_name = "llama3.1:8b";

        std::cout << "✓ LLM service initialized (Host: " << ollama_host
                  << ", Model: " << model_name << ")" << std::endl;
    }

    // Pull a model if not already available
    bool pullModel(const std::string& model = "") {
        std::string target_model = model.empty() ? model_name : model;

        std::cout << "📥 Pulling model: " << target_model << " (this may take a while)..." << std::endl;

        try {
            json payload;
            payload["name"] = target_model;
            payload["stream"] = false;

            makeRequest("/api/pull", payload);
            std::cout << "✅ Model pulled successfully: " << target_model << std::endl;
            return true;
        } catch (const std::exception& e) {
            std::cerr << "❌ Failed to pull model: " << e.what() << std::endl;
            return false;
        }
    }

    // Generate text using the LLM
    std::string generate(const std::string& prompt, const std::string& system_prompt = "") {
        try {
            json payload;
            payload["model"] = model_name;
            payload["prompt"] = prompt;
            payload["stream"] = false;

            // Add system prompt if provided
            if (!system_prompt.empty()) {
                payload["system"] = system_prompt;
            }

            // Generation options
            payload["options"] = json::object();
            payload["options"]["temperature"] = 0.7;
            payload["options"]["top_p"] = 0.9;
            payload["options"]["num_predict"] = 4096; // Max tokens to generate

            std::cout << "🤖 Generating with LLM..." << std::endl;
            std::string response = makeRequest("/api/generate", payload);

            // Parse response
            json response_json = json::parse(response);

            if (response_json.contains("response")) {
                std::cout << "✅ LLM generation complete" << std::endl;
                return response_json["response"].get<std::string>();
            } else {
                throw std::runtime_error("Invalid response format from Ollama");
            }

        } catch (const std::exception& e) {
            std::cerr << "❌ LLM generation failed: " << e.what() << std::endl;
            throw;
        }
    }

    // Chat-based generation (for multi-turn conversations)
    std::string chat(const std::vector<std::pair<std::string, std::string>>& messages,
                     const std::string& system_prompt = "") {
        try {
            json payload;
            payload["model"] = model_name;
            payload["stream"] = false;

            // Format messages
            json messages_array = json::array();

            // Add system message if provided
            if (!system_prompt.empty()) {
                json sys_msg;
                sys_msg["role"] = "system";
                sys_msg["content"] = system_prompt;
                messages_array.push_back(sys_msg);
            }

            // Add conversation messages
            for (const auto& [role, content] : messages) {
                json msg;
                msg["role"] = role;
                msg["content"] = content;
                messages_array.push_back(msg);
            }

            payload["messages"] = messages_array;

            std::cout << "🤖 Generating chat response with LLM..." << std::endl;
            std::string response = makeRequest("/api/chat", payload);

            // Parse response
            json response_json = json::parse(response);

            if (response_json.contains("message") &&
                response_json["message"].contains("content")) {
                std::cout << "✅ LLM chat generation complete" << std::endl;
                return response_json["message"]["content"].get<std::string>();
            } else {
                throw std::runtime_error("Invalid chat response format from Ollama");
            }

        } catch (const std::exception& e) {
            std::cerr << "❌ LLM chat generation failed: " << e.what() << std::endl;
            throw;
        }
    }

    // Check if Ollama service is available
    bool checkHealth() {
        try {
            CURL* curl = curl_easy_init();
            if (!curl) return false;

            std::string response;
            std::string url = ollama_host + "/api/tags";

            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
            curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);

            CURLcode res = curl_easy_perform(curl);
            curl_easy_cleanup(curl);

            return (res == CURLE_OK);
        } catch (...) {
            return false;
        }
    }

    // Set model to use
    void setModel(const std::string& model) {
        model_name = model;
        std::cout << "✓ LLM model set to: " << model_name << std::endl;
    }

    // Get current model
    std::string getModel() const {
        return model_name;
    }
};

#endif // LLM_SERVICE_H
