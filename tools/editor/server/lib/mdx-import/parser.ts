import matter from 'gray-matter';

export interface ParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

export async function parseMdx(mdx: string): Promise<ParseResult> {
  const { data: frontmatter, content: body } = matter(mdx);
  return { frontmatter, body };
}
