#ifndef SYSTEM_DETECTOR_H
#define SYSTEM_DETECTOR_H

#include <string>
#include <iostream>
#include <fstream>
#include <sstream>
#include <thread>
#include <cstdlib>

#ifdef __APPLE__
#include <sys/types.h>
#include <sys/sysctl.h>
#include <mach/mach.h>
#endif

#ifdef __linux__
#include <sys/sysinfo.h>
#include <unistd.h>
#endif

struct SystemSpecs {
    int cpu_cores;
    long total_ram_gb;
    long available_ram_gb;
    std::string gpu_type;
    bool has_metal;      // macOS Metal support
    bool has_cuda;       // NVIDIA CUDA support
    std::string platform;
    std::string cpu_brand;
};

class SystemDetector {
public:
    static SystemSpecs detectSystem() {
        SystemSpecs specs;

        specs.cpu_cores = detectCPUCores();
        specs.total_ram_gb = detectTotalRAM();
        specs.available_ram_gb = detectAvailableRAM();
        specs.platform = detectPlatform();
        specs.cpu_brand = detectCPUBrand();
        specs.gpu_type = detectGPU();
        specs.has_metal = detectMetal();
        specs.has_cuda = detectCUDA();

        return specs;
    }

private:
    static int detectCPUCores() {
        return std::thread::hardware_concurrency();
    }

    static long detectTotalRAM() {
#ifdef __APPLE__
        int64_t ram = 0;
        size_t size = sizeof(ram);
        if (sysctlbyname("hw.memsize", &ram, &size, NULL, 0) == 0) {
            return ram / (1024 * 1024 * 1024); // Convert to GB
        }
#elif __linux__
        struct sysinfo info;
        if (sysinfo(&info) == 0) {
            return (info.totalram * info.mem_unit) / (1024 * 1024 * 1024);
        }
#endif
        return 0;
    }

    static long detectAvailableRAM() {
#ifdef __APPLE__
        vm_statistics64_data_t vm_stats;
        mach_msg_type_number_t count = HOST_VM_INFO64_COUNT;
        if (host_statistics64(mach_host_self(), HOST_VM_INFO64,
                             (host_info64_t)&vm_stats, &count) == KERN_SUCCESS) {
            long free_memory = (vm_stats.free_count + vm_stats.inactive_count) *
                              sysconf(_SC_PAGESIZE);
            return free_memory / (1024 * 1024 * 1024);
        }
#elif __linux__
        struct sysinfo info;
        if (sysinfo(&info) == 0) {
            return ((info.freeram + info.bufferram) * info.mem_unit) /
                   (1024 * 1024 * 1024);
        }
#endif
        return 0;
    }

    static std::string detectPlatform() {
#ifdef __APPLE__
        return "macOS";
#elif __linux__
        return "Linux";
#elif _WIN32
        return "Windows";
#else
        return "Unknown";
#endif
    }

    static std::string detectCPUBrand() {
#ifdef __APPLE__
        char brand[256];
        size_t size = sizeof(brand);
        if (sysctlbyname("machdep.cpu.brand_string", &brand, &size, NULL, 0) == 0) {
            std::string cpu_str(brand);

            // Detect Apple Silicon
            if (cpu_str.find("Apple") != std::string::npos) {
                if (cpu_str.find("M1") != std::string::npos) return "Apple M1";
                if (cpu_str.find("M2") != std::string::npos) return "Apple M2";
                if (cpu_str.find("M3") != std::string::npos) return "Apple M3";
                if (cpu_str.find("M4") != std::string::npos) return "Apple M4";
                return "Apple Silicon";
            }

            // Intel processors
            if (cpu_str.find("Intel") != std::string::npos) {
                if (cpu_str.find("i9") != std::string::npos) return "Intel i9";
                if (cpu_str.find("i7") != std::string::npos) return "Intel i7";
                if (cpu_str.find("i5") != std::string::npos) return "Intel i5";
                return "Intel";
            }

            return cpu_str;
        }
#elif __linux__
        std::ifstream cpuinfo("/proc/cpuinfo");
        std::string line;
        while (std::getline(cpuinfo, line)) {
            if (line.find("model name") != std::string::npos) {
                size_t pos = line.find(":");
                if (pos != std::string::npos) {
                    std::string brand = line.substr(pos + 2);

                    // Simplify brand names
                    if (brand.find("Intel") != std::string::npos) {
                        if (brand.find("i9") != std::string::npos) return "Intel i9";
                        if (brand.find("i7") != std::string::npos) return "Intel i7";
                        if (brand.find("i5") != std::string::npos) return "Intel i5";
                        return "Intel";
                    }
                    if (brand.find("AMD") != std::string::npos) {
                        if (brand.find("Ryzen 9") != std::string::npos) return "AMD Ryzen 9";
                        if (brand.find("Ryzen 7") != std::string::npos) return "AMD Ryzen 7";
                        if (brand.find("Ryzen 5") != std::string::npos) return "AMD Ryzen 5";
                        return "AMD";
                    }

                    return brand;
                }
            }
        }
#endif
        return "Unknown";
    }

    static std::string detectGPU() {
#ifdef __APPLE__
        // Check for Metal-compatible GPU
        char model[256];
        size_t size = sizeof(model);
        if (sysctlbyname("machdep.cpu.brand_string", &model, &size, NULL, 0) == 0) {
            std::string cpu_str(model);
            if (cpu_str.find("Apple") != std::string::npos) {
                return "Apple GPU (Unified Memory)";
            }
        }
        return "Integrated GPU";
#elif __linux__
        // Try to detect NVIDIA GPU
        FILE* pipe = popen("nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null", "r");
        if (pipe) {
            char buffer[256];
            if (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                pclose(pipe);
                std::string gpu(buffer);
                gpu.erase(gpu.find_last_not_of(" \n\r\t") + 1);
                return gpu.empty() ? "Integrated GPU" : gpu;
            }
            pclose(pipe);
        }
        return "Integrated GPU";
#endif
        return "Unknown";
    }

    static bool detectMetal() {
#ifdef __APPLE__
        // Check if running on Apple Silicon (has Metal support)
        char brand[256];
        size_t size = sizeof(brand);
        if (sysctlbyname("machdep.cpu.brand_string", &brand, &size, NULL, 0) == 0) {
            std::string cpu_str(brand);
            return cpu_str.find("Apple") != std::string::npos;
        }
#endif
        return false;
    }

    static bool detectCUDA() {
#ifdef __linux__
        // Check if CUDA is available
        return system("which nvcc > /dev/null 2>&1") == 0;
#endif
        return false;
    }
};

#endif // SYSTEM_DETECTOR_H
