cmake_minimum_required(VERSION 3.15)
project(Echo)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find packages
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/libs/crow/include)
include_directories(${CMAKE_SOURCE_DIR}/libs/json/include)

# Source files
set(SOURCES
    src/main.cpp
)

# Create executable
add_executable(echo_server ${SOURCES})

# Link libraries
target_link_libraries(echo_server 
    OpenSSL::SSL 
    OpenSSL::Crypto
    ZLIB::ZLIB
    pthread
)

# Installation
install(TARGETS echo_server DESTINATION bin)