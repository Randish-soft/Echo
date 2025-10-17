#include "services/GitHubService.h"

#include <cstdlib>
#include <stdexcept>
#include <regex>
#include <sstream>
#include <iostream>
#include <system_error>

using std::string;
namespace fs = std::filesystem;

static string getenv_str(const char* key) {
    const char* v = std::getenv(key);
    return (v && *v) ? string(v) : string();
}

GitHubService::GitHubService()
    : token_(getenv_str("GITHUB_TOKEN")),
      repos_root_("/app/data/repositories")
{
    // Token may be empty for public repos; private will fail without it.
    if (!fs::exists(repos_root_)) {
        fs::create_directories(repos_root_);
    }
}

std::map<std::string, std::string>
GitHubService::cloneRepository(const string& github_url, const string& branch) {
    if (github_url.empty()) {
        throw std::runtime_error("github_url must not be empty");
    }
    if (branch.empty()) {
        throw std::runtime_error("branch must not be empty");
    }

    const string normalized = normalizeUrl(github_url);
    const string owner_repo  = extractOwnerRepo(normalized);
    if (owner_repo.empty() || owner_repo.find('/') == string::npos) {
        throw std::runtime_error("Unable to parse owner/repo from URL: " + github_url);
    }

    // repo_id uses owner-repo (no slash)
    string repo_id = owner_repo;
    std::replace(repo_id.begin(), repo_id.end(), '/', '-');

    fs::path dest = repos_root_ / repo_id;

    // If the folder exists and is non-empty, assume it's already cloned.
    if (!dirEmptyOrNonexistent(dest)) {
        // Optionally: pull latest here. For now, reuse.
        return { {"repo_id", repo_id}, {"local_path", dest.string()} };
    }

    ensureEmptyDir(dest);

    // Run git clone
    int rc = runGitClone(normalized, dest, branch);
    if (rc != 0) {
        // Best effort cleanup
        std::error_code ec;
        fs::remove_all(dest, ec);
        std::ostringstream oss;
        oss << "git clone failed with exit code " << rc
            << ". Ensure the repository exists and that GITHUB_TOKEN has access if private.";
        throw std::runtime_error(oss.str());
    }

    return { {"repo_id", repo_id}, {"local_path", dest.string()} };
}

string GitHubService::normalizeUrl(const string& input) {
    // Accept both "owner/repo" and "https://github.com/owner/repo"
    if (input.rfind("http://", 0) == 0 || input.rfind("https://", 0) == 0) {
        // Strip trailing ".git" if present
        if (input.size() > 4 && input.substr(input.size() - 4) == ".git") {
            return input.substr(0, input.size() - 4);
        }
        return input;
    }

    // If just "owner/repo", build full https URL
    if (input.find('/') != string::npos) {
        return "https://github.com/" + input;
    }

    throw std::runtime_error("Unexpected repository format. Use 'owner/repo' or a full https URL.");
}

string GitHubService::extractOwnerRepo(const string& normalizedUrl) {
    // Expect: https://github.com/<owner>/<repo>[/...]
    std::regex rx(R"(github\.com/([^/\s]+)/([^/\s]+))");
    std::smatch m;
    if (std::regex_search(normalizedUrl, m, rx) && m.size() >= 3) {
        return m[1].str() + "/" + m[2].str();
    }
    return {};
}

int GitHubService::runGitClone(const string& url, const fs::path& dest, const string& branch) const {
    // Use Authorization header via env var so the token isn't placed in argv.
    // This still exposes it to child process environment, but keeps it out of process list.
    // Public repos will clone fine without a token.
    string header;
    if (!token_.empty()) {
        header = "Authorization: Bearer " + token_;
        // setenv for this process and its children
        setenv("GIT_HTTP_EXTRAHEADER", header.c_str(), 1);
    }

    // Build command
    std::ostringstream cmd;
    cmd << "git clone --depth 1 --single-branch -b " << branch
        << " " << url << " " << dest.string() << " 2>&1";

    std::cout << "🔧 Running: git clone (token "
              << (token_.empty() ? "absent" : "present") << "), branch=" << branch << std::endl;

    int rc = std::system(cmd.str().c_str());

    // Unset header to avoid leaking into later git calls
    if (!token_.empty()) {
        unsetenv("GIT_HTTP_EXTRAHEADER");
    }
    return rc;
}

bool GitHubService::dirEmptyOrNonexistent(const fs::path& p) {
    if (!fs::exists(p)) return true;
    if (!fs::is_directory(p)) return false;
    for (auto it = fs::directory_iterator(p); it != fs::directory_iterator(); ++it) {
        return false; // found something
    }
    return true;
}

void GitHubService::ensureEmptyDir(const fs::path& p) {
    std::error_code ec;
    if (fs::exists(p)) fs::remove_all(p, ec);
    fs::create_directories(p, ec);
    if (ec) {
        throw std::runtime_error("Failed to prepare directory: " + p.string() + " (" + ec.message() + ")");
    }
}
