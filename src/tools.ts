import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const OSSINSIGHT_BASE_URL = "https://api.ossinsight.io/v1";

export type OssInsightResponse = {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type QueryRecord = Record<string, string | number | boolean | undefined>;
export type RequestFn = (path: string, query?: QueryRecord) => Promise<OssInsightResponse>;

export function buildUrl(path: string, query?: QueryRecord): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${OSSINSIGHT_BASE_URL}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function requestOssInsight(path: string, query?: QueryRecord): Promise<OssInsightResponse> {
  const url = buildUrl(path, query);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OSS Insight API failed (${response.status}): ${text}`);
  }

  return (await response.json()) as OssInsightResponse;
}

export function formatResponse(title: string, payload: unknown): string {
  return `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

function textResult(text: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

function compactQuery(query: QueryRecord): QueryRecord | undefined {
  const cleaned = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as QueryRecord;
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export async function listCollectionsTool(
  args: { page: number; per_page: number },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request("/collections", { page: args.page, per_page: args.per_page });
  return textResult(formatResponse("Collections", data));
}

export async function listHotCollectionsTool(request: RequestFn = requestOssInsight): Promise<CallToolResult> {
  const data = await request("/collections/hot");
  return textResult(formatResponse("Hot Collections", data));
}

export async function collectionRankingByIssuesTool(
  args: { collection_id: number; period?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(`/collections/${args.collection_id}/ranking_by_issues`, compactQuery({ period: args.period }));
  return textResult(formatResponse(`Collection ${args.collection_id} Ranking by Issues`, data));
}

export async function collectionRankingByPrsTool(
  args: { collection_id: number; period?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(`/collections/${args.collection_id}/ranking_by_prs`, compactQuery({ period: args.period }));
  return textResult(formatResponse(`Collection ${args.collection_id} Ranking by PRs`, data));
}

export async function collectionRankingByStarsTool(
  args: { collection_id: number; period?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(`/collections/${args.collection_id}/ranking_by_stars`, compactQuery({ period: args.period }));
  return textResult(formatResponse(`Collection ${args.collection_id} Ranking by Stars`, data));
}

export async function listCollectionRepositoriesTool(
  args: { collection_id: number; page?: number; page_size?: number },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/collections/${args.collection_id}/repos`,
    compactQuery({ page: args.page, page_size: args.page_size })
  );
  return textResult(formatResponse(`Collection ${args.collection_id} Repositories`, data));
}

export async function listTrendingReposTool(
  args: { period: "past_24_hours" | "past_week" | "past_month"; language?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request("/trends/repos", { period: args.period, language: args.language });
  return textResult(formatResponse("Trending Repositories", data));
}

export async function repoStargazersCountriesTool(
  args: { owner: string; repo: string; exclude_unknown?: boolean; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/stargazers/countries`,
    compactQuery({ exclude_unknown: args.exclude_unknown, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`Stargazer Countries for ${args.owner}/${args.repo}`, data));
}

export async function repoIssueCreatorsHistoryTool(
  args: { owner: string; repo: string; period?: string; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/issue_creators/history`,
    compactQuery({ period: args.period, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`Issue Creators History for ${args.owner}/${args.repo}`, data));
}

export async function listIssueCreatorsTool(
  args: { owner: string; repo: string; sort?: string; exclude_bots?: boolean; page?: number; page_size?: number },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/issue_creators`,
    compactQuery({
      sort: args.sort,
      exclude_bots: args.exclude_bots,
      page: args.page,
      page_size: args.page_size
    })
  );
  return textResult(formatResponse(`Issue Creators for ${args.owner}/${args.repo}`, data));
}

export async function issueCreatorsCountriesTool(
  args: { owner: string; repo: string; exclude_unknown?: boolean; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/issue_creators/countries`,
    compactQuery({ exclude_unknown: args.exclude_unknown, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`Issue Creator Countries for ${args.owner}/${args.repo}`, data));
}

export async function listPullRequestCreatorsTool(
  args: { owner: string; repo: string; sort?: string; exclude_bots?: boolean; page?: number; page_size?: number },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/pull_request_creators`,
    compactQuery({
      sort: args.sort,
      exclude_bots: args.exclude_bots,
      page: args.page,
      page_size: args.page_size
    })
  );
  return textResult(formatResponse(`Pull Request Creators for ${args.owner}/${args.repo}`, data));
}

export async function pullRequestCreatorsCountriesTool(
  args: { owner: string; repo: string; exclude_unknown?: boolean; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/pull_request_creators/countries`,
    compactQuery({ exclude_unknown: args.exclude_unknown, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`PR Creator Countries for ${args.owner}/${args.repo}`, data));
}

export async function pullRequestCreatorsHistoryTool(
  args: { owner: string; repo: string; period?: string; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/pull_request_creators/history`,
    compactQuery({ period: args.period, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`PR Creators History for ${args.owner}/${args.repo}`, data));
}

export async function pullRequestCreatorsOrganizationsTool(
  args: { owner: string; repo: string; exclude_unknown?: boolean; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/pull_request_creators/organizations`,
    compactQuery({ exclude_unknown: args.exclude_unknown, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`PR Creator Organizations for ${args.owner}/${args.repo}`, data));
}

export async function stargazersHistoryTool(
  args: { owner: string; repo: string; period?: string; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/stargazers/history`,
    compactQuery({ period: args.period, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`Stargazers History for ${args.owner}/${args.repo}`, data));
}

export async function stargazersOrganizationsTool(
  args: { owner: string; repo: string; exclude_unknown?: boolean; from?: string; to?: string },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(
    `/repos/${args.owner}/${args.repo}/stargazers/organizations`,
    compactQuery({ exclude_unknown: args.exclude_unknown, from: args.from, to: args.to })
  );
  return textResult(formatResponse(`Stargazer Organizations for ${args.owner}/${args.repo}`, data));
}

export async function ossInsightRequestTool(
  args: { path: string; query?: Record<string, string | number | boolean> },
  request: RequestFn = requestOssInsight
): Promise<CallToolResult> {
  const data = await request(args.path, args.query);
  return textResult(formatResponse(`OSS Insight Response: ${args.path}`, data));
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "list_collections",
    {
      description: "List OSS Insight collections.",
      inputSchema: z.object({
        page: z.number().int().min(1).default(1),
        per_page: z.number().int().min(1).max(100).default(20)
      })
    },
    (args) => listCollectionsTool(args)
  );

  server.registerTool(
    "list_hot_collections",
    {
      description: "List hot collections with top repositories."
    },
    () => listHotCollectionsTool()
  );

  server.registerTool(
    "collection_ranking_by_issues",
    {
      description: "Rank repositories in a collection by issues.",
      inputSchema: z.object({
        collection_id: z.number().int().positive(),
        period: z.string().optional()
      })
    },
    (args) => collectionRankingByIssuesTool(args)
  );

  server.registerTool(
    "collection_ranking_by_prs",
    {
      description: "Rank repositories in a collection by pull requests.",
      inputSchema: z.object({
        collection_id: z.number().int().positive(),
        period: z.string().optional()
      })
    },
    (args) => collectionRankingByPrsTool(args)
  );

  server.registerTool(
    "collection_ranking_by_stars",
    {
      description: "Rank repositories in a collection by stars.",
      inputSchema: z.object({
        collection_id: z.number().int().positive(),
        period: z.string().optional()
      })
    },
    (args) => collectionRankingByStarsTool(args)
  );

  server.registerTool(
    "list_collection_repositories",
    {
      description: "List repositories in a collection.",
      inputSchema: z.object({
        collection_id: z.number().int().positive(),
        page: z.number().int().positive().optional(),
        page_size: z.number().int().positive().max(100).optional()
      })
    },
    (args) => listCollectionRepositoriesTool(args)
  );

  server.registerTool(
    "list_trending_repos",
    {
      description: "List trending repositories from OSS Insight.",
      inputSchema: z.object({
        period: z.enum(["past_24_hours", "past_week", "past_month"]).default("past_week"),
        language: z.string().optional()
      })
    },
    (args) => listTrendingReposTool(args)
  );

  server.registerTool(
    "repo_stargazers_countries",
    {
      description: "List stargazer countries/regions for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        exclude_unknown: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => repoStargazersCountriesTool(args)
  );

  server.registerTool(
    "repo_stargazers_history",
    {
      description: "Get stargazers history for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        period: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => stargazersHistoryTool(args)
  );

  server.registerTool(
    "repo_stargazers_organizations",
    {
      description: "List organizations of stargazers for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        exclude_unknown: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => stargazersOrganizationsTool(args)
  );

  server.registerTool(
    "list_issue_creators",
    {
      description: "List issue creators for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        sort: z.string().optional(),
        exclude_bots: z.boolean().optional(),
        page: z.number().int().positive().optional(),
        page_size: z.number().int().positive().max(100).optional()
      })
    },
    (args) => listIssueCreatorsTool(args)
  );

  server.registerTool(
    "issue_creators_countries",
    {
      description: "List countries/regions of issue creators for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        exclude_unknown: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => issueCreatorsCountriesTool(args)
  );

  server.registerTool(
    "repo_issue_creators_history",
    {
      description: "Get issue creators history for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        period: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => repoIssueCreatorsHistoryTool(args)
  );

  server.registerTool(
    "list_pull_request_creators",
    {
      description: "List pull request creators for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        sort: z.string().optional(),
        exclude_bots: z.boolean().optional(),
        page: z.number().int().positive().optional(),
        page_size: z.number().int().positive().max(100).optional()
      })
    },
    (args) => listPullRequestCreatorsTool(args)
  );

  server.registerTool(
    "pull_request_creators_countries",
    {
      description: "List countries/regions of PR creators for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        exclude_unknown: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => pullRequestCreatorsCountriesTool(args)
  );

  server.registerTool(
    "pull_request_creators_history",
    {
      description: "Get pull request creators history for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        period: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => pullRequestCreatorsHistoryTool(args)
  );

  server.registerTool(
    "pull_request_creators_organizations",
    {
      description: "List organizations of PR creators for a repository.",
      inputSchema: z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        exclude_unknown: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      })
    },
    (args) => pullRequestCreatorsOrganizationsTool(args)
  );

  server.registerTool(
    "ossinsight_request",
    {
      description: "Call any OSS Insight GET endpoint under /v1 and return JSON.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Endpoint path, such as /repos/pingcap/tidb/stargazers/countries"),
        query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
      })
    },
    (args) => ossInsightRequestTool(args)
  );
}
