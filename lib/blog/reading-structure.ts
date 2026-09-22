import type { Root, RootContent } from "mdast";

function textOf(node: RootContent): string {
  if ("value" in node) return node.value;
  if ("children" in node)
    return node.children.map((child) => textOf(child as RootContent)).join("");
  return "";
}

/** Keep the page title and generated contents outside the article body. */
export function readingStructure({ title }: { title: string }) {
  return (tree: Root) => {
    const first = tree.children[0];
    if (
      first?.type === "heading" &&
      textOf(first).trim().toLowerCase() === title.trim().toLowerCase()
    )
      tree.children.shift();
    tree.children = tree.children.filter((node, index, nodes) => {
      const isContents = (candidate: RootContent | undefined) =>
        candidate?.type === "heading" &&
        /^(table of contents|contents)$/i.test(textOf(candidate).trim());
      const isLinkList = (candidate: RootContent | undefined): boolean =>
        candidate?.type === "list" &&
        candidate.children.every((item) =>
          item.children.every(
            (paragraph) =>
              paragraph.type === "paragraph" &&
              paragraph.children.every(
                (child) =>
                  child.type === "link" ||
                  (child.type === "text" && !child.value.trim()),
              ),
          ),
        );
      if (isContents(node) && isLinkList(nodes[index + 1])) return false;
      if (isLinkList(node) && isContents(nodes[index - 1])) return false;
      return true;
    });
    if (
      tree.children.some((node) => node.type === "heading" && node.depth === 1)
    ) {
      tree.children.forEach((node) => {
        if (node.type === "heading")
          node.depth = Math.min(6, node.depth + 1) as 2 | 3 | 4 | 5 | 6;
      });
    }
  };
}
