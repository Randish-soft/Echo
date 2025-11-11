#ifndef PROMPT_TEMPLATES_H
#define PROMPT_TEMPLATES_H

#include <string>
#include <map>

class PromptTemplates {
public:
    // System prompts for different documentation contexts
    static std::string getSystemPrompt(const std::string& doc_type) {
        static const std::map<std::string, std::string> system_prompts = {
            {"api_documentation",
             "You are a technical documentation expert specializing in API documentation. "
             "Your task is to create clear, comprehensive API documentation that includes "
             "endpoints, request/response formats, parameters, authentication, and examples. "
             "Follow REST API documentation best practices. Use Markdown format."},

            {"database_documentation",
             "You are a database architect and documentation specialist. "
             "Your task is to document database schemas, table structures, relationships, "
             "indexes, constraints, and data models. Include entity relationship descriptions "
             "and migration information. Use Markdown format with clear diagrams descriptions."},

            {"architecture_documentation",
             "You are a software architect specializing in system design documentation. "
             "Your task is to document system architecture, component interactions, "
             "design patterns, data flow, and architectural decisions. Focus on high-level "
             "design and explain the reasoning behind architectural choices. Use Markdown format."},

            {"developer_onboarding",
             "You are a developer relations expert creating onboarding documentation. "
             "Your task is to create a comprehensive guide for new developers joining the project. "
             "Include setup instructions, development workflow, coding standards, architecture overview, "
             "and first contribution guidance. Be welcoming and thorough. Use Markdown format."},

            {"code_conventions",
             "You are a code quality expert documenting coding standards and conventions. "
             "Your task is to document code style guidelines, naming conventions, file organization, "
             "best practices, and code review standards. Be specific and provide examples. Use Markdown format."},

            {"user_manual",
             "You are a technical writer specializing in user documentation. "
             "Your task is to create clear, user-friendly documentation for end users. "
             "Focus on how to use features, step-by-step instructions, common workflows, "
             "and avoid technical jargon. Be clear and accessible. Use Markdown format."},

            {"installation_guide",
             "You are a DevOps and technical documentation specialist. "
             "Your task is to create a comprehensive installation and setup guide. "
             "Include system requirements, prerequisites, installation steps for different platforms, "
             "configuration, troubleshooting, and verification steps. Use Markdown format."},

            {"faq",
             "You are a support documentation expert creating FAQ documentation. "
             "Your task is to anticipate common questions and provide clear, concise answers. "
             "Organize questions by category, provide practical solutions, and include troubleshooting tips. "
             "Use Markdown format with clear Q&A structure."},

            {"troubleshooting_guide",
             "You are a support engineer creating troubleshooting documentation. "
             "Your task is to document common issues, their symptoms, root causes, and solutions. "
             "Include diagnostic steps, error message explanations, and workarounds. "
             "Use Markdown format with clear problem-solution structure."},

            {"release_notes",
             "You are a release manager creating release notes documentation. "
             "Your task is to document changes, new features, bug fixes, breaking changes, "
             "upgrade instructions, and deprecations. Be clear about impact on users. Use Markdown format."},

            {"integration_guide",
             "You are an integration specialist creating integration documentation. "
             "Your task is to document how to integrate this system with other systems. "
             "Include authentication, API usage, webhooks, SDKs, and integration patterns. "
             "Provide code examples. Use Markdown format."},

            {"technical_specification",
             "You are a technical specification writer creating detailed technical specs. "
             "Your task is to create comprehensive technical documentation that can serve as "
             "a foundation for formal documentation. Include system overview, technical requirements, "
             "detailed specifications, and technical constraints. Use Markdown format."}
        };

        auto it = system_prompts.find(doc_type);
        if (it != system_prompts.end()) {
            return it->second;
        }

        // Default system prompt
        return "You are a technical documentation expert. Create clear, comprehensive, "
               "and well-structured documentation in Markdown format.";
    }

    // Generate context-aware prompt with repository data
    static std::string buildPrompt(
        const std::string& doc_type,
        const std::string& audience,
        const std::string& repo_overview,
        const std::string& file_structure,
        const std::string& key_files_summary
    ) {
        std::ostringstream prompt;

        prompt << "# Documentation Generation Task\n\n";
        prompt << "**Documentation Type:** " << doc_type << "\n";
        prompt << "**Target Audience:** " << audience << "\n\n";

        prompt << "## Repository Overview\n\n";
        prompt << repo_overview << "\n\n";

        prompt << "## File Structure\n\n";
        prompt << file_structure << "\n\n";

        prompt << "## Key Files and Components\n\n";
        prompt << key_files_summary << "\n\n";

        prompt << "---\n\n";
        prompt << "Based on the above information, generate comprehensive "
               << doc_type << " documentation.\n\n";

        // Add specific instructions based on doc type
        prompt << getSpecificInstructions(doc_type, audience);

        return prompt.str();
    }

private:
    static std::string getSpecificInstructions(const std::string& doc_type, const std::string& audience) {
        static const std::map<std::string, std::string> instructions = {
            {"api_documentation",
             "## Instructions:\n"
             "1. Document all API endpoints found in the codebase\n"
             "2. For each endpoint, specify: HTTP method, path, description, parameters, request body, response format\n"
             "3. Include authentication requirements\n"
             "4. Provide example requests and responses\n"
             "5. Document error codes and handling\n"
             "6. Group endpoints by functionality\n"},

            {"database_documentation",
             "## Instructions:\n"
             "1. Document all database tables/collections\n"
             "2. For each table: describe purpose, list all columns/fields with types and constraints\n"
             "3. Document relationships between tables (foreign keys, references)\n"
             "4. Include indexes and their purpose\n"
             "5. Describe any migrations or schema evolution\n"
             "6. Document data models and their business logic\n"},

            {"architecture_documentation",
             "## Instructions:\n"
             "1. Provide high-level system architecture overview\n"
             "2. Describe main components and their responsibilities\n"
             "3. Explain how components interact (data flow, communication patterns)\n"
             "4. Document design patterns used\n"
             "5. Explain key architectural decisions and trade-offs\n"
             "6. Include deployment architecture if applicable\n"},

            {"developer_onboarding",
             "## Instructions:\n"
             "1. Start with a welcoming introduction\n"
             "2. Provide prerequisite knowledge and tools needed\n"
             "3. Guide through development environment setup\n"
             "4. Explain project structure and organization\n"
             "5. Document development workflow (branching, testing, deployment)\n"
             "6. Provide guidance for making first contribution\n"
             "7. List resources for learning more\n"},

            {"user_manual",
             "## Instructions:\n"
             "1. Start with an overview of what the software does\n"
             "2. Document main features with step-by-step usage instructions\n"
             "3. Include screenshots descriptions or UI flow\n"
             "4. Provide common use cases and workflows\n"
             "5. Explain settings and configuration options\n"
             "6. Use simple, non-technical language\n"},

            {"installation_guide",
             "## Instructions:\n"
             "1. List system requirements (OS, dependencies, hardware)\n"
             "2. Document prerequisites and required software\n"
             "3. Provide installation steps for different platforms\n"
             "4. Include configuration instructions\n"
             "5. Document environment variables and settings\n"
             "6. Provide verification steps to confirm successful installation\n"
             "7. Include common installation issues and solutions\n"},

            {"faq",
             "## Instructions:\n"
             "1. Organize FAQs into logical categories\n"
             "2. Start with most common questions\n"
             "3. Provide clear, concise answers\n"
             "4. Include code examples where relevant\n"
             "5. Link to detailed documentation for complex topics\n"
             "6. Cover installation, usage, troubleshooting, and advanced topics\n"},

            {"troubleshooting_guide",
             "## Instructions:\n"
             "1. List common problems with clear descriptions\n"
             "2. For each issue: describe symptoms, likely causes, and solutions\n"
             "3. Provide diagnostic steps\n"
             "4. Include error messages and their meanings\n"
             "5. Offer workarounds when direct solutions aren't available\n"
             "6. Provide contact information for additional support\n"}
        };

        auto it = instructions.find(doc_type);
        if (it != instructions.end()) {
            return it->second;
        }

        return "## Instructions:\nCreate comprehensive, well-structured documentation.\n";
    }
};

#endif // PROMPT_TEMPLATES_H
