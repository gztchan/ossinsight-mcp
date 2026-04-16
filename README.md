# ossinsight-mcp

An MCP server (stdio) for the OSS Insight Public API.

## Prerequisites

- Node.js 20+

## Install

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

Build bundle and start:

```bash
pnpm build
pnpm start
```

## From npm (recommended)

```bash
npm i -g ossinsight-mcp
```

Run:

```bash
ossinsight-mcp
```

Or via `npx`:

```bash
npx -y ossinsight-mcp
```

## Configuration

Add this server to your MCP config:

```json
{
  "mcpServers": {
    "ossinsight": {
      "command": "npx",
      "args": ["-y", "ossinsight-mcp"]
    }
  }
}
```

## Included MCP tools

- `list_collections`
- `list_hot_collections`
- `collection_ranking_by_issues`
- `collection_ranking_by_prs`
- `collection_ranking_by_stars`
- `list_collection_repositories`
- `list_trending_repos`
- `list_issue_creators`
- `issue_creators_countries`
- `repo_issue_creators_history`
- `list_pull_request_creators`
- `pull_request_creators_countries`
- `pull_request_creators_history`
- `pull_request_creators_organizations`
- `repo_stargazers_countries`
- `repo_stargazers_history`
- `repo_stargazers_organizations`
- `ossinsight_request` (generic GET endpoint wrapper)

## API reference

- Docs: https://ossinsight.io/docs/api
- Base URL: `https://api.ossinsight.io/v1`
- Public beta auth: no auth required (rate limited)

## Notes

- This server currently calls GET endpoints only.
- The `ossinsight_request` tool helps you quickly use new endpoints without code changes.
