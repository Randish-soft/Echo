// api/src/utils/markdown.util.ts

/**
 * Normalize a heading string into a GitHub-style anchor.
 * Example: "API Reference v1.0" -> "api-reference-v10"
 */
export function slugifyHeading(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // remove non-word characters
      .trim()
      .replace(/\s+/g, "-"); // spaces -> dashes
  }
  
  /**
   * Generate a Markdown Table of Contents from an array of headings.
   */
  export function generateTOC(headings: string[]): string {
    return headings
      .map((h) => {
        const slug = slugifyHeading(h);
        return `- [${h}](#${slug})`;
      })
      .join("\n");
  }
  
  /**
   * Wrap given metadata + content into Markdown with YAML frontmatter.
   */
  export function wrapWithFrontmatter(
    metadata: Record<string, string | number | boolean | null | undefined>,
    content: string
  ): string {
    const entries = Object.entries(metadata).filter(
      ([, v]) => v !== undefined && v !== null
    );
  
    const frontmatter = [
      "---",
      ...entries.map(([k, v]) => `${k}: ${v}`),
      "---\n",
    ].join("\n");
  
    return `${frontmatter}${content.trim()}\n`;
  }
  
  /**
   * Extract all Markdown headings (H1–H3) from text.
   */
  export function extractHeadings(markdown: string): string[] {
    const regex = /^(#{1,3})\s+(.*)$/gm;
    const headings: string[] = [];
    let match: RegExpExecArray | null;
  
    while ((match = regex.exec(markdown)) !== null) {
      headings.push(match[2].trim());
    }
  
    return headings;
  }
  
  /**
   * Generate a full document with a TOC automatically added at the top.
   */
  export function addTOC(markdown: string): string {
    const headings = extractHeadings(markdown);
    if (!headings.length) return markdown;
  
    const toc = generateTOC(headings);
    return `## Table of Contents\n\n${toc}\n\n${markdown}`;
  }
  