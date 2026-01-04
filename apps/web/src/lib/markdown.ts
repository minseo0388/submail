import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export async function processMarkdown(content: string): Promise<string> {
    const result = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSanitize) // Default schema prevents XSS
        .use(rehypeStringify)
        .process(content);

    return result.toString();
}
