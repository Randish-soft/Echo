cmake_minimum_required(VERSION 3.16)
project(echo_server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find packages
find_package(PkgConfig REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)
find_package(Boost REQUIRED COMPONENTS system)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/libs/crow/include
    ${CMAKE_SOURCE_DIR}/libs/json/include
)

# Add executable
add_executable(echo_server
    src/main.cpp
    # Add other source files as needed
)

# Link libraries
target_link_libraries(echo_server
    OpenSSL::SSL
    OpenSSL::Crypto
    ZLIB::ZLIB
    Boost::system
    pthread
)

# For the simplified Dockerfile version, use:
# target_link_libraries(echo_server crow nlohmann_json::nlohmann_json ...)