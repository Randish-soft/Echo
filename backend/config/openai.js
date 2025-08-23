const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const defaultConfig = {
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
    temperature: 0.7,
    presence_penalty: 0,
    frequency_penalty: 0
};

const analyzeCodeChunk = async (chunk, projectContext = '') => {
    try {
        const prompt = `You are an expert code analyst. Analyze the following code chunk and provide insights about its functionality, purpose, and how it fits within the project context.

Project Context: ${projectContext}

Code chunk from file: ${chunk.filePath}
Lines ${chunk.startLine}-${chunk.endLine}:

\`\`\`${chunk.extension.replace('.', '')}
${chunk.content}
\`\`\`

Please provide a concise analysis covering:
1. Primary functionality and purpose
2. Key components (functions, classes, variables)
3. Dependencies and imports
4. How it connects to other parts of the project
5. Any notable patterns or architectural decisions

Keep the analysis focused and technical, suitable for documentation generation.`;

        const response = await openai.chat.completions.create({
            ...defaultConfig,
            messages: [
                {
                    role: "system",
                    content: "You are an expert software architect and code analyst. Provide clear, concise, and technically accurate analysis of code."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return {
            success: true,
            analysis: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: response.model
        };
    } catch (error) {
        console.error('OpenAI analysis error:', error);
        return {
            success: false,
            error: error.message,
            analysis: null,
            tokensUsed: 0
        };
    }
};

const generateProjectOverview = async (analysisContent, repositoryInfo) => {
    try {
        const prompt = `Based on the following code analysis, generate a comprehensive project overview for documentation.

Repository: ${repositoryInfo.fullName}
Description: ${repositoryInfo.description || 'No description provided'}
Primary Language: ${repositoryInfo.language || 'Mixed'}

Code Analysis:
${analysisContent}

Generate a project overview that includes:
1. Project purpose and main functionality
2. Architecture overview
3. Key technologies and dependencies
4. Main components and their relationships
5. Setup and installation requirements
6. Basic usage examples
7. Project structure explanation

Format the response in clear, well-structured markdown suitable for documentation.`;

        const response = await openai.chat.completions.create({
            ...defaultConfig,
            max_tokens: 6000,
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical writer specializing in software documentation. Create comprehensive, clear, and user-friendly documentation."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return {
            success: true,
            overview: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: response.model
        };
    } catch (error) {
        console.error('OpenAI overview generation error:', error);
        return {
            success: false,
            error: error.message,
            overview: null,
            tokensUsed: 0
        };
    }
};

const generateDocumentation = async (analysisContent, repositoryInfo, documentationType, customPrompt = '') => {
    try {
        let basePrompt = '';
        
        switch (documentationType) {
            case 'readme':
                basePrompt = `Create a comprehensive README.md file for this project. Include installation instructions, usage examples, API documentation if applicable, contributing guidelines, and any other relevant information for users and contributors.`;
                break;
            case 'api':
                basePrompt = `Generate detailed API documentation. Focus on endpoints, request/response formats, authentication, error handling, and provide clear examples for each API endpoint.`;
                break;
            case 'internal':
                basePrompt = `Create internal developer documentation. Focus on code architecture, design patterns, development setup, testing procedures, and implementation details for team members.`;
                break;
            case 'external':
                basePrompt = `Generate user-facing documentation. Focus on how to use the software, features overview, tutorials, troubleshooting, and user guides.`;
                break;
            case 'technical':
                basePrompt = `Create technical documentation covering system architecture, database schemas, deployment procedures, performance considerations, and technical specifications.`;
                break;
            case 'user-guide':
                basePrompt = `Generate a comprehensive user guide with step-by-step instructions, screenshots placeholders, common workflows, and troubleshooting sections.`;
                break;
            default:
                basePrompt = `Create comprehensive documentation for this project based on the analysis provided.`;
        }

        const prompt = `${customPrompt || basePrompt}

Repository Information:
- Name: ${repositoryInfo.fullName}
- Description: ${repositoryInfo.description || 'No description provided'}
- Primary Language: ${repositoryInfo.language || 'Mixed'}
- Topics: ${repositoryInfo.topics?.join(', ') || 'None'}

Detailed Code Analysis:
${analysisContent}

Requirements:
- Use proper markdown formatting
- Include code examples where appropriate
- Make it comprehensive but easy to understand
- Structure it logically with clear headings
- Include table of contents if the document is long
- Add badges and links where relevant

Generate high-quality documentation that would be valuable for the intended audience.`;

        const response = await openai.chat.completions.create({
            ...defaultConfig,
            max_tokens: 8000,
            temperature: 0.5,
            messages: [
                {
                    role: "system",
                    content: `You are an expert technical writer and documentation specialist. Create clear, comprehensive, and well-structured documentation that follows best practices for ${documentationType} documentation.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return {
            success: true,
            documentation: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: response.model
        };
    } catch (error) {
        console.error('OpenAI documentation generation error:', error);
        return {
            success: false,
            error: error.message,
            documentation: null,
            tokensUsed: 0
        };
    }
};

const improveDocumentation = async (existingDoc, feedback, repositoryInfo) => {
    try {
        const prompt = `Improve the following documentation based on the feedback provided.

Repository: ${repositoryInfo.fullName}
Feedback: ${feedback}

Existing Documentation:
${existingDoc}

Please improve the documentation by addressing the feedback while maintaining the overall structure and quality. Keep all the good parts and enhance or fix the areas mentioned in the feedback.`;

        const response = await openai.chat.completions.create({
            ...defaultConfig,
            max_tokens: 8000,
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical writer. Improve existing documentation based on user feedback while maintaining quality and structure."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return {
            success: true,
            improvedDoc: response.choices[0].message.content,
            tokensUsed: response.usage.total_tokens,
            model: response.model
        };
    } catch (error) {
        console.error('OpenAI improvement error:', error);
        return {
            success: false,
            error: error.message,
            improvedDoc: null,
            tokensUsed: 0
        };
    }
};

module.exports = {
    openai,
    defaultConfig,
    analyzeCodeChunk,
    generateProjectOverview,
    generateDocumentation,
    improveDocumentation
};