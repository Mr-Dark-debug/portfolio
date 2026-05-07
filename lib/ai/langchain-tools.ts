import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  fetchPublicProfilePage,
  getVerifiedProfileInfo,
  readLocalPortfolioContent,
  searchWeb,
} from "./tool-functions";

export const langChainPortfolioTools = [
  new DynamicStructuredTool({
    name: "get_verified_profile_info",
    description: "Return verified public profile facts about Prashant Choudhary.",
    schema: z.object({
      topic: z.string().optional(),
    }),
    func: async (input) => JSON.stringify(await getVerifiedProfileInfo(input)),
  }),
  new DynamicStructuredTool({
    name: "search_web",
    description: "Search the public web for general factual context when local/profile data is insufficient.",
    schema: z.object({
      query: z.string(),
    }),
    func: async (input) => JSON.stringify(await searchWeb(input)),
  }),
  new DynamicStructuredTool({
    name: "fetch_public_profile_page",
    description: "Fetch and summarize approved public profile pages for Prashant.",
    schema: z.object({
      url: z.string().url(),
    }),
    func: async (input) => JSON.stringify(await fetchPublicProfilePage(input)),
  }),
  new DynamicStructuredTool({
    name: "read_local_portfolio_content",
    description: "Search local markdown portfolio/blog content available in the repository.",
    schema: z.object({
      query: z.string(),
    }),
    func: async (input) => JSON.stringify(await readLocalPortfolioContent(input)),
  }),
];
