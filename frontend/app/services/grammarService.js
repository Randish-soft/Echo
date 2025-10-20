// Advanced grammar checking service with Word-like features
class GrammarService {
    constructor() {
        this.rules = {
            // Grammar rules
            passiveVoice: {
                pattern: /\b(am|is|are|was|were|be|being|been)\s+[a-z]+ed\b/gi,
                suggestion: "Consider using active voice",
                category: "Clarity"
            },
            longSentences: {
                pattern: /[^.!?]{40,}[.!?]/g,
                suggestion: "Sentence might be too long. Consider breaking it up",
                category: "Readability"
            },
            repeatedWords: {
                pattern: /\b(\w+)\s+\1\b/gi,
                suggestion: "Repeated word detected",
                category: "Editing"
            },
            weakWords: {
                pattern: /\b(just|very|really|quite|somewhat|rather)\b/gi,
                suggestion: "Consider using stronger, more specific language",
                category: "Clarity"
            },
            complexWords: {
                pattern: /\b(utilize|facilitate|implement|leverage|paradigm)\b/gi,
                suggestion: "Consider using simpler alternatives",
                category: "Clarity"
            },
            contractions: {
                pattern: /\b(cannot|will not|do not|did not|is not|are not)\b/gi,
                suggestion: "Consider using contractions for informal writing",
                category: "Style"
            },
            vagueLanguage: {
                pattern: /\b(thing|stuff|a lot|kind of|sort of)\b/gi,
                suggestion: "Consider being more specific",
                category: "Clarity"
            },
            missingCommas: {
                pattern: /(\w+)\s+(and|or|but)\s+(\w+)/gi,
                suggestion: "Consider adding a comma before conjunction",
                category: "Punctuation"
            }
        };

        this.simpleCorrections = {
            "teh": "the",
            "adn": "and",
            "recieve": "receive",
            "seperate": "separate",
            "definately": "definitely",
            "occured": "occurred",
            "commited": "committed"
        };
    }

    // Advanced text analysis with Word-like features
    analyzeText(text) {
        if (!text || text.length < 10) {
            return {
                issues: [],
                suggestions: [],
                score: 100,
                wordCount: 0,
                characterCount: 0,
                paragraphCount: 0,
                readingTime: 0
            };
        }

        const issues = [];
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const characters = text.replace(/\s/g, '').length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Check each grammar rule
        Object.entries(this.rules).forEach(([ruleName, rule]) => {
            const matches = [...text.matchAll(rule.pattern)];
            if (matches.length > 0) {
                matches.forEach(match => {
                    const issue = {
                        type: ruleName,
                        category: rule.category,
                        suggestion: rule.suggestion,
                        text: match[0],
                        startIndex: match.index,
                        endIndex: match.index + match[0].length,
                        severity: this.getIssueSeverity(ruleName, match[0])
                    };
                    issues.push(issue);
                });
            }
        });

        // Check for spelling mistakes (simple dictionary-based)
        const spellingIssues = this.checkSpelling(text);
        issues.push(...spellingIssues);

        // Calculate overall score
        const score = this.calculateScore(issues, words.length);

        return {
            issues: issues.sort((a, b) => a.startIndex - b.startIndex),
            suggestions: [...new Set(issues.map(issue => issue.suggestion))],
            score: Math.max(score, 0),
            metrics: {
                wordCount: words.length,
                characterCount: characters,
                paragraphCount: paragraphs.length,
                sentenceCount: sentences.length,
                readingTime: Math.ceil(words.length / 200), // 200 wpm
                readability: this.calculateReadability(text)
            }
        };
    }

    // Simple spelling checker (in a real app, you'd use a proper dictionary)
    checkSpelling(text) {
        const issues = [];
        const words = text.split(/\b/);
        let currentIndex = 0;

        words.forEach(word => {
            if (word.length > 2 && /^[a-zA-Z]+$/.test(word)) {
                const lowerWord = word.toLowerCase();
                if (this.simpleCorrections[lowerWord]) {
                    issues.push({
                        type: "spelling",
                        category: "Spelling",
                        suggestion: `Did you mean "${this.simpleCorrections[lowerWord]}"?`,
                        text: word,
                        startIndex: currentIndex,
                        endIndex: currentIndex + word.length,
                        severity: "high",
                        correction: this.simpleCorrections[lowerWord]
                    });
                }
            }
            currentIndex += word.length;
        });

        return issues;
    }

    getIssueSeverity(type, text) {
        const severityMap = {
            spelling: "high",
            passiveVoice: "medium",
            longSentences: "low",
            repeatedWords: "low",
            weakWords: "low",
            complexWords: "low",
            contractions: "low",
            vagueLanguage: "medium",
            missingCommas: "low"
        };
        return severityMap[type] || "low";
    }

    calculateScore(issues, wordCount) {
        if (wordCount === 0) return 100;

        let score = 100;
        issues.forEach(issue => {
            switch (issue.severity) {
                case "high": score -= 3; break;
                case "medium": score -= 2; break;
                case "low": score -= 1; break;
            }
        });

        // Normalize by word count
        const issueDensity = issues.length / wordCount;
        if (issueDensity > 0.1) score -= 10;
        if (issueDensity > 0.2) score -= 15;

        return Math.max(score, 0);
    }

    calculateReadability(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (words.length === 0 || sentences.length === 0) return 100;
        
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = this.estimateSyllablesPerWord(words);
        
        let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        return Math.max(Math.min(score, 100), 0);
    }

    estimateSyllablesPerWord(words) {
        let totalSyllables = 0;
        words.forEach(word => {
            word = word.toLowerCase().replace(/'/g, '');
            const syllables = word.split(/[aeiouy]+/).filter(s => s).length;
            totalSyllables += Math.max(syllables, 1);
        });
        return totalSyllables / words.length;
    }

    // Word-like auto-correct with context awareness
    autoCorrect(text, issues = []) {
        let corrected = text;
        const corrections = [];

        // Apply spelling corrections
        Object.entries(this.simpleCorrections).forEach(([wrong, correct]) => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            if (regex.test(corrected)) {
                corrected = corrected.replace(regex, correct);
                corrections.push({ from: wrong, to: correct });
            }
        });

        // Apply issue-specific corrections
        issues.forEach(issue => {
            if (issue.correction) {
                const issueText = corrected.substring(issue.startIndex, issue.endIndex);
                corrected = corrected.substring(0, issue.startIndex) + 
                           issue.correction + 
                           corrected.substring(issue.endIndex);
                corrections.push({ from: issueText, to: issue.correction });
            }
        });

        // Smart punctuation
        corrected = corrected.replace(/([a-z])\.\s+([A-Z])/g, '$1. $2');
        corrected = corrected.replace(/\s+\./g, '.');
        corrected = corrected.replace(/\s+,/g, ',');

        return {
            text: corrected,
            corrections: corrections
        };
    }

    // Get suggestions for specific text range
    getSuggestionsForRange(text, start, end) {
        const selectedText = text.substring(start, end);
        const analysis = this.analyzeText(selectedText);
        
        return {
            text: selectedText,
            suggestions: analysis.suggestions,
            issues: analysis.issues
        };
    }

    // Ignore specific issue (like Word's "Ignore Once")
    ignoreIssue(text, issue) {
        // In a real implementation, you might store ignored issues
        // and filter them out from future analyses
        console.log(`Ignoring issue: ${issue.type} at position ${issue.startIndex}`);
        return true;
    }

    // Add to dictionary (like Word's "Add to Dictionary")
    addToDictionary(word) {
        // In a real implementation, you'd add this to a custom dictionary
        console.log(`Added to dictionary: ${word}`);
        return true;
    }
}

// Create singleton instance
const grammarService = new GrammarService();

export default grammarService;