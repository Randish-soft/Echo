cmake_minimum_required(VERSION 3.10)
project(echo_backend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Threads REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/crow/include
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/json/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

add_executable(echo_server src/main.cpp)

target_link_libraries(echo_server
    Threads::Threads
    OpenSSL::SSL
    OpenSSL::Crypto
    ZLIB::ZLIB
)

set_target_properties(echo_server PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
)
