// Grammar checking service for documentation editor
class GrammarService {
    constructor() {
        this.rules = {
            // Common grammar rules
            passiveVoice: /\b(am|is|are|was|were|be|being|been)\s+[a-z]+ed\b/gi,
            longSentences: /[^.!?]{50,}[.!?]/g,
            repeatedWords: /\b(\w+)\s+\1\b/gi,
            weakWords: /\b(just|very|really|quite|somewhat|rather)\b/gi,
            complexWords: /\b(utilize|facilitate|implement|leverage)\b/gi,
            
            // Code documentation specific rules
            todoComments: /TODO|FIXME|XXX/gi,
            unclearComments: /\b(this|that|it)\b/gi,
            missingPeriods: /[a-z][^.!?]$/gm
        };

        this.suggestions = {
            passiveVoice: "Consider using active voice for clearer documentation",
            longSentences: "Sentence might be too long. Consider breaking it up",
            repeatedWords: "Repeated word detected",
            weakWords: "Consider using stronger, more specific language",
            complexWords: "Consider using simpler alternatives",
            todoComments: "TODO comment found - consider addressing before finalizing",
            unclearComments: "Unclear reference - consider being more specific",
            missingPeriods: "Sentence might be missing ending punctuation"
        };
    }

    // Analyze text for grammar and style issues
    analyzeText(text) {
        const issues = [];
        const suggestions = [];
        let overallScore = 100;

        // Skip analysis for very short texts
        if (!text || text.length < 10) {
            return {
                issues: [],
                suggestions: ["Add more content for better analysis"],
                score: 100,
                wordCount: 0
            };
        }

        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Check each rule
        Object.entries(this.rules).forEach(([ruleName, pattern]) => {
            const matches = text.match(pattern);
            if (matches) {
                issues.push({
                    type: ruleName,
                    count: matches.length,
                    examples: matches.slice(0, 3) // Show first 3 examples
                });
                
                if (this.suggestions[ruleName]) {
                    suggestions.push(this.suggestions[ruleName]);
                }
                
                // Deduct points for each issue type
                overallScore -= Math.min(matches.length * 2, 10);
            }
        });

        // Additional metrics
        const avgSentenceLength = wordCount / sentences.length;
        if (avgSentenceLength > 25) {
            issues.push({
                type: "averageSentenceLength",
                count: Math.round(avgSentenceLength),
                examples: [`Average sentence length: ${Math.round(avgSentenceLength)} words`]
            });
            suggestions.push("Consider shorter sentences for better readability");
            overallScore -= 5;
        }

        // Calculate readability metrics
        const readabilityScore = this.calculateReadability(text);
        if (readabilityScore < 60) {
            issues.push({
                type: "readability",
                count: Math.round(readabilityScore),
                examples: [`Readability score: ${Math.round(readabilityScore)}/100`]
            });
            suggestions.push("Consider simplifying language for better readability");
            overallScore -= 10;
        }

        return {
            issues,
            suggestions: [...new Set(suggestions)], // Remove duplicates
            score: Math.max(overallScore, 0),
            wordCount,
            sentenceCount: sentences.length,
            readabilityScore: Math.round(readabilityScore)
        };
    }

    // Simple readability calculation (Flesch-like)
    calculateReadability(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (words.length === 0 || sentences.length === 0) return 100;
        
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = this.estimateSyllablesPerWord(words);
        
        // Simplified Flesch Reading Ease-like calculation
        let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        return Math.max(Math.min(score, 100), 0);
    }

    estimateSyllablesPerWord(words) {
        let totalSyllables = 0;
        words.forEach(word => {
            // Simple syllable estimation
            word = word.toLowerCase().replace(/'/g, '');
            const syllables = word.split(/[aeiouy]+/).filter(s => s).length;
            totalSyllables += Math.max(syllables, 1);
        });
        return totalSyllables / words.length;
    }

    // Get grammar suggestions for specific text
    getSuggestions(text) {
        const analysis = this.analyzeText(text);
        return analysis.suggestions;
    }

    // Check if text needs improvement
    needsImprovement(text) {
        const analysis = this.analyzeText(text);
        return analysis.score < 70;
    }

    // Auto-correct common issues
    autoCorrect(text) {
        let corrected = text;

        // Fix repeated words
        corrected = corrected.replace(/\b(\w+)\s+\1\b/gi, '$1');

        // Fix missing periods at end of paragraphs
        corrected = corrected.replace(/([a-z])\n\n/g, '$1.\n\n');

        // Capitalize sentences
        corrected = corrected.replace(/(?:^|[.!?]\s+)([a-z])/g, match => match.toUpperCase());

        return corrected;
    }
}

// Create singleton instance
const grammarService = new GrammarService();

export default grammarService;