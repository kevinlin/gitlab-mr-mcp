[![GitHub stars](https://img.shields.io/github/stars/kevinlin/gitlab-mr-mcp?style=flat)](https://github.com/kevinlin/gitlab-mr-mcp/stargazers)
[![License](https://img.shields.io/github/license/kevinlin/gitlab-mr-mcp)](LICENSE)
[![smithery badge](https://smithery.ai/badge/@kevinlin/gitlab-mr-mcp)](https://smithery.ai/server/@kevinlin/gitlab-mr-mcp)

# 🚀 GitLab MR MCP

An MCP server that enables AI agents to seamlessly interact with GitLab repositories, manage merge requests, review code, and post comments directly from your AI assistant.

## 📌 Overview

This project implements a server using the Model Context Protocol (MCP) that allows AI agents to interact with GitLab repositories. It provides tools for:

- Listing available GitLab projects
- Fetching merge request details and comments
- Getting merge request diffs
- Adding comments to merge requests
- Adding line-specific comments to code in merge request diffs
- Fetching issue details
- Setting merge request title and description

## 📦 Installation

### 🚀 Using npx (Recommended)

You can run this package directly using npx without installation:

```bash
# Set environment variables
export MR_MCP_GITLAB_HOST="your_gitlab_host"
export MR_MCP_GITLAB_TOKEN="your_gitlab_token"

# Run with npx
npx gitlab-mr-mcp@0.1.0
```

For MCP client configuration when using npx:
```json
{
  "mcpServers": {
    "gitlab-mr-mcp": {
      "command": "npx",
      "args": ["gitlab-mr-mcp@0.1.0"],
      "env": {
        "MR_MCP_GITLAB_HOST": "your_gitlab_host",
        "MR_MCP_GITLAB_TOKEN": "your_gitlab_token"
      }
    }
  }
}
```

### 🛠️ Manual Installation

#### 🔧 Prerequisites

- Node.js
- GitLab access token with API access
- GitLab project ID(s)

#### 📖 Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Add the following to your MCP client configuration:
```json
{
  "mcpServers": {
    "gitlab-mr-mcp": {
      "command": "node",
      "args": ["/path/to/gitlab-mr-mcp/index.js"],
      "env": {
        "MR_MCP_GITLAB_HOST": "your_gitlab_host",
        "MR_MCP_GITLAB_TOKEN": "your_gitlab_token"
      }
    }
  }
}
```

## 🛠️ Available Tools

* `get_projects`
  Gets a list of GitLab projects accessible with your token.

* `list_open_merge_requests`
  Lists all open merge requests in the specified project.

* `get_merge_request_details`
  Gets detailed information about a specific merge request.

* `get_merge_request_comments`
  Gets comments from a specific merge request, including discussion notes and diff notes.

* `add_merge_request_comment`
  Adds a general comment to a merge request.

* `add_merge_request_diff_comment`
  Adds a comment to a specific line in a file within a merge request.

* `get_merge_request_diff`
  Gets the diff for a merge request.

* `get_issue_details`
  Gets detailed information about a specific issue.

* `set_merge_request_title`
  Set the title of a merge request

* `set_merge_request_description`
  Set the description of a merge request

## 🏗️ Development

### 🔍 Running Inspector

Set up environment variables:

```bash
export MR_MCP_GITLAB_TOKEN=your_gitlab_token
export MR_MCP_GITLAB_HOST=your_gitlab_host

# Optional evn vars to filter the projects the `get_projects` tool has access to:
# https://docs.gitlab.com/api/access_requests/#valid-access-levels
export MR_MCP_MIN_ACCESS_LEVEL=min_access_level
# Search term that should match the project path or name 
export MR_MCP_PROJECT_SEARCH_TERM=term 
```

For use with MCP clients, you can run:

```bash
npx -y @modelcontextprotocol/inspector npm start
```

## 🛠️ Troubleshooting

If you encounter issues with the GitLab MR MCP server:

1. **Check MCP client logs first** - Enable debug logging in your MCP client to see detailed error messages and connection status. This will help identify if the issue is with the server connection, authentication, or specific tool calls.

2. If you encounter permissions issues (403 Forbidden), check:
   - Your GitLab token has the proper scopes (api, read_api)
   - The token user has proper access to the projects
   - The project IDs are correct

## 📜 License

[MIT](LICENSE)