import { describe, expect, it } from "vitest";
import {
  buildUrl,
  collectionRankingByIssuesTool,
  collectionRankingByPrsTool,
  collectionRankingByStarsTool,
  issueCreatorsCountriesTool,
  listCollectionRepositoriesTool,
  listCollectionsTool,
  listHotCollectionsTool,
  listIssueCreatorsTool,
  listPullRequestCreatorsTool,
  listTrendingReposTool,
  ossInsightRequestTool,
  pullRequestCreatorsCountriesTool,
  pullRequestCreatorsHistoryTool,
  pullRequestCreatorsOrganizationsTool,
  repoIssueCreatorsHistoryTool,
  repoStargazersCountriesTool,
  stargazersHistoryTool,
  stargazersOrganizationsTool,
  requestOssInsight
} from "../src/tools.js";

describe("tool handlers", () => {
  it("list_collections calls collections endpoint", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ name: "database" }] };
    };

    const result = await listCollectionsTool({ page: 2, per_page: 10 }, request as never);

    expect(calls).toEqual([{ path: "/collections", query: { page: 2, per_page: 10 } }]);
    expect(result.content[0]).toMatchObject({ type: "text" });
    expect((result.content[0] as { text: string }).text).toContain("Collections");
  });

  it("list_hot_collections calls hot endpoint", async () => {
    const calls: string[] = [];
    const request = async (path: string) => {
      calls.push(path);
      return { rows: [{ id: 1 }] };
    };

    const result = await listHotCollectionsTool(request as never);

    expect(calls).toEqual(["/collections/hot"]);
    expect((result.content[0] as { text: string }).text).toContain("Hot Collections");
  });

  it("collection_ranking_by_issues calls issues ranking endpoint", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ repo: "a/b" }] };
    };

    await collectionRankingByIssuesTool({ collection_id: 8, period: "past_28_days" }, request as never);
    expect(calls).toEqual([
      { path: "/collections/8/ranking_by_issues", query: { period: "past_28_days" } }
    ]);
  });

  it("collection_ranking_by_prs calls prs ranking endpoint", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ repo: "a/b" }] };
    };

    await collectionRankingByPrsTool({ collection_id: 8, period: "past_28_days" }, request as never);
    expect(calls).toEqual([{ path: "/collections/8/ranking_by_prs", query: { period: "past_28_days" } }]);
  });

  it("collection_ranking_by_stars calls stars ranking endpoint", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ repo: "a/b" }] };
    };

    await collectionRankingByStarsTool({ collection_id: 8 }, request as never);
    expect(calls).toEqual([{ path: "/collections/8/ranking_by_stars", query: undefined }]);
  });

  it("list_collection_repositories calls repos endpoint with paging", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ repo_name: "foo/bar" }] };
    };

    await listCollectionRepositoriesTool({ collection_id: 12, page: 2, page_size: 50 }, request as never);
    expect(calls).toEqual([{ path: "/collections/12/repos", query: { page: 2, page_size: 50 } }]);
  });

  it("list_trending_repos sends period and language", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ repo: "foo/bar" }] };
    };

    const result = await listTrendingReposTool({ period: "past_week", language: "TypeScript" }, request as never);

    expect(calls).toEqual([
      { path: "/trends/repos", query: { period: "past_week", language: "TypeScript" } }
    ]);
    expect((result.content[0] as { text: string }).text).toContain("Trending Repositories");
  });

  it("repo_stargazers_countries builds repository path", async () => {
    const calls: string[] = [];
    const request = async (path: string) => {
      calls.push(path);
      return { rows: [{ country_or_area: "US" }] };
    };

    const result = await repoStargazersCountriesTool({ owner: "pingcap", repo: "tidb" }, request as never);

    expect(calls).toEqual(["/repos/pingcap/tidb/stargazers/countries"]);
    expect((result.content[0] as { text: string }).text).toContain("Stargazer Countries for pingcap/tidb");
  });

  it("repo_stargazers_history supports period query", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ date: "2026-01-01", stargazers: 1 }] };
    };

    await stargazersHistoryTool({ owner: "pingcap", repo: "tidb", period: "past_12_months" }, request as never);
    expect(calls).toEqual([
      { path: "/repos/pingcap/tidb/stargazers/history", query: { period: "past_12_months" } }
    ]);
  });

  it("repo_stargazers_organizations supports date-range filters", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ organization: "pingcap" }] };
    };

    await stargazersOrganizationsTool(
      { owner: "pingcap", repo: "tidb", exclude_unknown: true, from: "2025-01-01", to: "2026-01-01" },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/stargazers/organizations",
        query: { exclude_unknown: true, from: "2025-01-01", to: "2026-01-01" }
      }
    ]);
  });

  it("list_issue_creators forwards list filters", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ login: "alice" }] };
    };

    await listIssueCreatorsTool(
      { owner: "pingcap", repo: "tidb", sort: "issue_count", exclude_bots: true, page: 1, page_size: 20 },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/issue_creators",
        query: { sort: "issue_count", exclude_bots: true, page: 1, page_size: 20 }
      }
    ]);
  });

  it("issue_creators_countries forwards geo filters", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ country_or_area: "US" }] };
    };

    await issueCreatorsCountriesTool(
      { owner: "pingcap", repo: "tidb", exclude_unknown: true, from: "2025-01-01", to: "2026-01-01" },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/issue_creators/countries",
        query: { exclude_unknown: true, from: "2025-01-01", to: "2026-01-01" }
      }
    ]);
  });

  it("repo_issue_creators_history sends period query", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ date: "2026-01-01", count: 1 }] };
    };

    const result = await repoIssueCreatorsHistoryTool(
      { owner: "pingcap", repo: "tidb", period: "past_28_days" },
      request as never
    );

    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/issue_creators/history",
        query: { period: "past_28_days" }
      }
    ]);
    expect((result.content[0] as { text: string }).text).toContain("Issue Creators History for pingcap/tidb");
  });

  it("list_pull_request_creators forwards list filters", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ login: "bob" }] };
    };

    await listPullRequestCreatorsTool(
      { owner: "pingcap", repo: "tidb", sort: "pull_request_count", exclude_bots: true, page: 3, page_size: 10 },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/pull_request_creators",
        query: { sort: "pull_request_count", exclude_bots: true, page: 3, page_size: 10 }
      }
    ]);
  });

  it("pull_request_creators_countries forwards geo filters", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ country_or_area: "CN" }] };
    };

    await pullRequestCreatorsCountriesTool(
      { owner: "pingcap", repo: "tidb", exclude_unknown: false, from: "2024-01-01", to: "2025-01-01" },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/pull_request_creators/countries",
        query: { exclude_unknown: false, from: "2024-01-01", to: "2025-01-01" }
      }
    ]);
  });

  it("pull_request_creators_history forwards period", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ date: "2026-01-01", count: 2 }] };
    };

    await pullRequestCreatorsHistoryTool(
      { owner: "pingcap", repo: "tidb", period: "past_12_months" },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/pull_request_creators/history",
        query: { period: "past_12_months" }
      }
    ]);
  });

  it("pull_request_creators_organizations forwards date range", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ organization: "pingcap" }] };
    };

    await pullRequestCreatorsOrganizationsTool(
      { owner: "pingcap", repo: "tidb", from: "2024-01-01", to: "2025-01-01", exclude_unknown: true },
      request as never
    );
    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/pull_request_creators/organizations",
        query: { exclude_unknown: true, from: "2024-01-01", to: "2025-01-01" }
      }
    ]);
  });

  it("ossinsight_request forwards custom path and query", async () => {
    const calls: Array<{ path: string; query?: unknown }> = [];
    const request = async (path: string, query?: unknown) => {
      calls.push({ path, query });
      return { rows: [{ count: 3 }] };
    };

    const result = await ossInsightRequestTool(
      { path: "/repos/pingcap/tidb/stargazers/countries", query: { limit: 3, pretty: true } },
      request as never
    );

    expect(calls).toEqual([
      {
        path: "/repos/pingcap/tidb/stargazers/countries",
        query: { limit: 3, pretty: true }
      }
    ]);
    expect((result.content[0] as { text: string }).text).toContain(
      "OSS Insight Response: /repos/pingcap/tidb/stargazers/countries"
    );
  });
});

describe("request helpers", () => {
  it("buildUrl supports relative path and query", () => {
    const url = buildUrl("collections", { page: 2, include_hot: true, ignored: undefined });
    expect(url).toBe("https://api.ossinsight.io/v1/collections?page=2&include_hot=true");
  });

  it("requestOssInsight throws API error body", async () => {
    globalThis.fetch = async () => new Response("bad request", { status: 400 }) as never;
    await expect(requestOssInsight("/collections")).rejects.toThrow("OSS Insight API failed (400): bad request");
  });

  it("requestOssInsight returns parsed JSON", async () => {
    const payload = { type: "sql_endpoint", data: { rows: [{ count: "1" }] } };
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" }
      }) as never;

    await expect(requestOssInsight("/collections")).resolves.toEqual(payload);
  });
});
