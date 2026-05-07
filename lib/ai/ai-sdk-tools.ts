import { tool } from "ai";
import { z } from "zod";
import {
  fetchPublicProfilePage,
  getVerifiedProfileInfo,
  readLocalPortfolioContent,
  searchWeb,
} from "./tool-functions";

export function createPortfolioTools() {
  return {
    getVerifiedProfileInfo: tool({
      description: "Use for verified public facts about Prashant Choudhary, his education, and public links.",
      inputSchema: z.object({
        topic: z.string().optional().describe("Requested profile topic."),
      }),
      execute: getVerifiedProfileInfo,
    }),
    searchWeb: tool({
      description: "Search the public web when the user asks for general current or external context.",
      inputSchema: z.object({
        query: z.string().describe("Search query."),
      }),
      execute: searchWeb,
    }),
    fetchPublicProfilePage: tool({
      description: "Fetch approved public profile pages such as Prashant's website, GitHub, LinkedIn, YouTube, blog, or X.",
      inputSchema: z.object({
        url: z.string().url().describe("Approved public profile URL."),
      }),
      execute: fetchPublicProfilePage,
    }),
    readLocalPortfolioContent: tool({
      description: "Search local markdown blog/portfolio content in this repository.",
      inputSchema: z.object({
        query: z.string().describe("Topic or keyword to search for."),
      }),
      execute: readLocalPortfolioContent,
    }),
  };
}
