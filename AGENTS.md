# AGENTS.md - GitLab MR MCP Server

## Build/Test Commands
- **Start**: `npm start` or `node index.js`
- **Test with Inspector**: `npx -y @modelcontextprotocol/inspector npm start`
- **No tests/lint defined** - this is a simple MCP server

## Environment Variables
- `MR_MCP_GITLAB_TOKEN` (required) - GitLab API token with api/read_api scopes
- `MR_MCP_GITLAB_HOST` (optional) - GitLab host URL
- `MR_MCP_MIN_ACCESS_LEVEL` (optional) - Minimum project access level filter
- `MR_MCP_PROJECT_SEARCH_TERM` (optional) - Project search term filter

## Code Style Guidelines
- **Module system**: ES modules (`"type": "module"` in package.json)
- **Imports**: Use explicit file extensions (`.js`)
- **Naming**: camelCase for variables/functions, snake_case for API parameters
- **Error handling**: Use try/catch with `formatErrorResponse()` helper
- **Async/await**: Preferred over promises
- **Logging**: Use `console.error()` with `[MCP]` prefix for debugging
- **API responses**: Return `{ content: [{ type: "text", text: "..." }] }` format
- **Validation**: Use Zod schemas for input validation where needed
- **Filtering**: Provide `verbose` parameter for detailed vs filtered responses