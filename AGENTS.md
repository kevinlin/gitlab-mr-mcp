# AGENTS.md - GitLab MR MCP Server

## Build/Test Commands
- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Start**: `npm start` - Run compiled JavaScript from dist/
- **Dev**: `npm run dev` - Build and run in one command
- **Typecheck**: `npm run typecheck` - Type check without emitting files
- **Test with Inspector**: `npx -y @modelcontextprotocol/inspector npm start`

## Environment Variables
- `MR_MCP_GITLAB_TOKEN` (required) - GitLab API token with api/read_api scopes
- `MR_MCP_GITLAB_HOST` (optional) - GitLab host URL
- `MR_MCP_MIN_ACCESS_LEVEL` (optional) - Minimum project access level filter
- `MR_MCP_PROJECT_SEARCH_TERM` (optional) - Project search term filter

## TypeScript Code Style Guidelines
- **Strict TypeScript**: Enabled with exactOptionalPropertyTypes and noUncheckedIndexedAccess
- **Interfaces vs Types**: Use interfaces for object definitions, types for unions/mapped types
- **Naming**: PascalCase for types/interfaces, camelCase for variables/functions
- **Imports**: Use explicit file extensions (`.js` for compiled output)
- **Error handling**: Typed errors with custom error types and `formatErrorResponse()` helper
- **Immutability**: Use `readonly` for immutable properties and parameters
- **Type safety**: Avoid `any`, prefer `unknown` for unknown types
- **API responses**: Strictly typed `MCPResponse` interface
- **Validation**: Zod schemas with TypeScript integration for runtime type checking