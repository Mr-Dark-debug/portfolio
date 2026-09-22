import { describe, expect, it } from "vitest";
import { remark } from "remark";
import { readingStructure } from "../lib/blog/reading-structure";
const render = async (markdown: string) =>
  String(
    await remark()
      .use(readingStructure, { title: "A guide" })
      .process(markdown),
  );
describe("reading structure", () => {
  it("removes a duplicate title and linked manual contents while preserving code and nested headings", async () => {
    const output = await render(
      "# A guide\n\nIntro.\n\n## Table of contents\n\n1. [Setup](#setup)\n\n# Setup\n\n## Detail\n\n```sh\n# this is a comment\n``` ",
    );
    expect(output).not.toContain("# A guide");
    expect(output).not.toContain("Table of contents");
    expect(output).toContain("## Setup");
    expect(output).toContain("### Detail");
    expect(output).toContain("# this is a comment");
  });
  it("keeps existing h2 hierarchy and substantive contents sections", async () => {
    const output = await render(
      "# A guide\n\n## Contents\n\nThese are explanatory notes.\n\n## Setup\n\n### Detail",
    );
    expect(output).toContain("## Contents");
    expect(output).toContain("explanatory notes");
    expect(output).toContain("## Setup");
    expect(output).toContain("### Detail");
  });
});
