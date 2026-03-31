import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

export interface ParseResult {
  frontmatter: Record<string, unknown>;
  ast: any; // MDAST Root node
  body: string;
}

export async function parseMarkdown(markdown: string): Promise<ParseResult> {
  const { data: frontmatter, content: body } = matter(markdown);
  const ast = unified().use(remarkParse).parse(body);
  return { frontmatter, ast, body };
}
