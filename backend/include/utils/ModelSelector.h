#ifndef MODEL_SELECTOR_H
#define MODEL_SELECTOR_H

#include <string>
#include <vector>
#include <map>
#include "SystemDetector.h"

struct ModelConfig {
    std::string model_name;
    std::string display_name;
    std::string tier;
    int min_ram_gb;
    int min_cores;
    int recommended_ram_gb;
    int recommended_cores;
    int context_length;
    int num_predict;
    float temperature;
    std::string description;
    int estimated_time_sec;  // Estimated generation time in seconds
};

class ModelSelector {
private:
    static std::vector<ModelConfig> getModelConfigs() {
        return {
            // High-Performance Models (Servers, High-end Workstations, M3 Pro/Max/Ultra)
            {
                "llama3.1:8b",
                "Llama 3.1 (8B)",
                "high",
                16, 8,      // min ram/cores
                32, 12,     // recommended ram/cores
                8192,       // context length
                3072,       // num_predict
                0.5,        // temperature
                "Best quality, comprehensive documentation. For high-end systems with 16GB+ RAM.",
                90          // ~1.5 minutes
            },
            {
                "mistral:7b",
                "Mistral (7B)",
                "high",
                16, 8,
                32, 12,
                8192,
                3072,
                0.5,
                "Excellent quality with good reasoning. Alternative to Llama 3.1.",
                85
            },

            // Mid-Range Models (Modern laptops, M1/M2, Good desktops)
            {
                "llama3.1:3b",
                "Llama 3.1 (3B)",
                "medium",
                8, 4,       // min ram/cores
                16, 8,      // recommended ram/cores
                4096,       // context length
                2048,       // num_predict
                0.5,        // temperature
                "Good quality, faster generation. For systems with 8-16GB RAM.",
                45          // ~45 seconds
            },
            {
                "phi3:3.8b",
                "Phi-3 (3.8B)",
                "medium",
                8, 4,
                16, 8,
                4096,
                2048,
                0.5,
                "Microsoft's efficient model. Great balance of speed and quality.",
                40
            },
            {
                "gemma:2b",
                "Gemma (2B)",
                "medium",
                6, 4,
                12, 6,
                4096,
                2048,
                0.5,
                "Google's lightweight model. Very efficient for mid-range systems.",
                35
            },

            // Low-End Models (Older laptops, Low RAM systems)
            {
                "phi3:mini",
                "Phi-3 Mini (3.8B)",
                "low",
                4, 2,       // min ram/cores
                8, 4,       // recommended ram/cores
                2048,       // context length
                1536,       // num_predict
                0.5,        // temperature
                "Lightweight, fast generation. For systems with 4-8GB RAM.",
                25          // ~25 seconds
            },
            {
                "tinyllama:1.1b",
                "TinyLlama (1.1B)",
                "low",
                2, 2,
                4, 4,
                2048,
                1024,
                0.6,
                "Ultra-lightweight model. For low-end systems or quick drafts.",
                15
            }
        };
    }

public:
    // Select optimal model based on system specs
    static ModelConfig selectOptimalModel(const SystemSpecs& specs) {
        std::vector<ModelConfig> models = getModelConfigs();

        std::cout << "\n🔍 System Analysis:" << std::endl;
        std::cout << "   Platform: " << specs.platform << std::endl;
        std::cout << "   CPU: " << specs.cpu_brand << " (" << specs.cpu_cores << " cores)" << std::endl;
        std::cout << "   RAM: " << specs.total_ram_gb << " GB total, "
                  << specs.available_ram_gb << " GB available" << std::endl;
        std::cout << "   GPU: " << specs.gpu_type << std::endl;
        if (specs.has_metal) std::cout << "   Metal: Available ✓" << std::endl;
        if (specs.has_cuda) std::cout << "   CUDA: Available ✓" << std::endl;

        // Calculate performance score
        int perf_score = calculatePerformanceScore(specs);

        std::cout << "\n📊 Performance Score: " << perf_score << "/100" << std::endl;

        // Select model based on performance score and available resources
        ModelConfig selected;

        if (perf_score >= 70 && specs.total_ram_gb >= 16 && specs.cpu_cores >= 8) {
            // High-end system
            selected = getModelByName(models, "llama3.1:8b");
            std::cout << "   Tier: HIGH-PERFORMANCE 🚀" << std::endl;
        }
        else if (perf_score >= 50 && specs.total_ram_gb >= 8 && specs.cpu_cores >= 4) {
            // Mid-range system
            selected = getModelByName(models, "llama3.1:3b");
            std::cout << "   Tier: MID-RANGE ⚡" << std::endl;
        }
        else if (perf_score >= 30 && specs.total_ram_gb >= 6) {
            // Low-mid range
            selected = getModelByName(models, "gemma:2b");
            std::cout << "   Tier: EFFICIENT 💨" << std::endl;
        }
        else {
            // Low-end system
            selected = getModelByName(models, "phi3:mini");
            std::cout << "   Tier: LIGHTWEIGHT 🪶" << std::endl;
        }

        std::cout << "\n✅ Selected Model: " << selected.display_name << std::endl;
        std::cout << "   Model ID: " << selected.model_name << std::endl;
        std::cout << "   Description: " << selected.description << std::endl;
        std::cout << "   Estimated Time: ~" << selected.estimated_time_sec << " seconds" << std::endl;
        std::cout << std::endl;

        return selected;
    }

    // Get all available model configurations
    static std::vector<ModelConfig> getAllModels() {
        return getModelConfigs();
    }

    // Get model by name
    static ModelConfig getModelByName(const std::vector<ModelConfig>& models, const std::string& name) {
        for (const auto& model : models) {
            if (model.model_name == name) {
                return model;
            }
        }
        // Return first model as fallback
        return models[0];
    }

    // Get models by tier
    static std::vector<ModelConfig> getModelsByTier(const std::string& tier) {
        std::vector<ModelConfig> models = getModelConfigs();
        std::vector<ModelConfig> filtered;

        for (const auto& model : models) {
            if (model.tier == tier) {
                filtered.push_back(model);
            }
        }

        return filtered;
    }

private:
    // Calculate system performance score (0-100)
    static int calculatePerformanceScore(const SystemSpecs& specs) {
        int score = 0;

        // CPU Score (0-40 points)
        int cpu_score = 0;
        if (specs.cpu_cores >= 12) cpu_score = 40;
        else if (specs.cpu_cores >= 8) cpu_score = 30;
        else if (specs.cpu_cores >= 6) cpu_score = 20;
        else if (specs.cpu_cores >= 4) cpu_score = 10;
        else cpu_score = 5;

        // Add bonus for high-performance CPUs
        if (specs.cpu_brand.find("M3") != std::string::npos ||
            specs.cpu_brand.find("M4") != std::string::npos) {
            cpu_score += 10;
        } else if (specs.cpu_brand.find("M2") != std::string::npos ||
                   specs.cpu_brand.find("i9") != std::string::npos ||
                   specs.cpu_brand.find("Ryzen 9") != std::string::npos) {
            cpu_score += 5;
        }

        score += std::min(cpu_score, 40);

        // RAM Score (0-30 points)
        int ram_score = 0;
        if (specs.total_ram_gb >= 32) ram_score = 30;
        else if (specs.total_ram_gb >= 16) ram_score = 20;
        else if (specs.total_ram_gb >= 8) ram_score = 10;
        else if (specs.total_ram_gb >= 4) ram_score = 5;
        else ram_score = 2;

        score += ram_score;

        // GPU/Acceleration Score (0-30 points)
        int gpu_score = 0;
        if (specs.has_metal) {
            gpu_score = 30; // Metal is very efficient for LLMs
        } else if (specs.has_cuda) {
            gpu_score = 25; // CUDA is good
        } else if (specs.gpu_type != "Unknown" && specs.gpu_type != "Integrated GPU") {
            gpu_score = 15; // Dedicated GPU
        } else {
            gpu_score = 5; // Integrated/Unknown
        }

        score += gpu_score;

        return std::min(score, 100);
    }
};

#endif // MODEL_SELECTOR_H
