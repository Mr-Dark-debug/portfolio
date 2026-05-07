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
    get_verified_profile_info: tool({
      description: "Retrieves the verified facts about Prashant Choudhary (education, public links, etc.).",
      inputSchema: z.object({
        topic: z.string().optional().describe("Requested profile topic."),
      }),
      execute: getVerifiedProfileInfo,
    }),
    search_web: tool({
      description: "Performs a public-web search for general information (e.g., technical topics, news, public pages).",
      inputSchema: z.object({
        query: z.string().describe("Search query."),
      }),
      execute: searchWeb,
    }),
    fetch_public_profile_page: tool({
      description: "Fetches the content of an approved public URL from Prashant's profiles (website, GitHub, LinkedIn, YouTube, blog, X, etc.).",
      inputSchema: z.object({
        url: z.string().url().describe("Approved public profile URL."),
      }),
      execute: fetchPublicProfilePage,
    }),
    read_local_portfolio_content: tool({
      description: "Looks through the markdown files that make up Prashant's portfolio repository (e.g., blog posts, project write-ups) to find relevant excerpts.",
      inputSchema: z.object({
        query: z.string().describe("Topic or keyword to search for."),
      }),
      execute: readLocalPortfolioContent,
    }),
  };
}
