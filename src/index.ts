#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Gitlab } from "@gitbeaker/rest";
import { z } from "zod";
import type {
  GitLabMRMcpConfig,
  ToolHandlerArgs,
  ProjectFilter,
  FilteredProject,
  FilteredMergeRequest,
  FilteredMergeRequestDetails,
  FilteredComments,
  FilteredDiscussionNote,
  FilteredDiffNote,
  FilteredIssue,
  MCPResponse,
  EnvironmentConfig
} from "./types.js";

const GITLAB_TOKEN = process.env.MR_MCP_GITLAB_TOKEN;
if (!GITLAB_TOKEN) {
  console.error("Error: MR_MCP_GITLAB_TOKEN environment variable is not set.");
  process.exit(1);
}

const config: EnvironmentConfig = {
  gitlabToken: GITLAB_TOKEN,
  gitlabHost: process.env.MR_MCP_GITLAB_HOST ?? undefined,
  minAccessLevel: process.env.MR_MCP_MIN_ACCESS_LEVEL ?? undefined,
  projectSearchTerm: process.env.MR_MCP_PROJECT_SEARCH_TERM ?? undefined,
};

// Create GitLab API instance with proper options
const gitlabOptions = config.gitlabHost 
  ? { host: config.gitlabHost, token: config.gitlabToken }
  : { token: config.gitlabToken };

const api = new Gitlab(gitlabOptions);

const formatErrorResponse = (error: Error): MCPResponse => ({
  content: [{ type: "text", text: `Error: ${error.message} - ${(error.cause as { description?: string })?.description || "No additional details"}` }],
  isError: true,
});

export function createServer(): McpServer {
  const serverConfig: GitLabMRMcpConfig = {
    name: 'GitlabMrMCP',
    version: '1.0.0'
  };

  const server = new McpServer(serverConfig, {
    capabilities: { tools: {} }
  });

  server.registerTool(
    'get_projects',
    {
      title: 'Get Projects',
      description: 'Get a list of projects with id, name, description, web_url and other useful information.',
      inputSchema: {
        verbose: z.boolean().optional()
      }
    },
    async (args) => {
      try {
        return await getProjects(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'list_open_merge_requests',
    {
      title: 'List Open Merge Requests',
      description: 'List all open merge requests in the project',
      inputSchema: {
        project_id: z.number(),
        verbose: z.boolean().optional()
      }
    },
    async (args) => {
      try {
        return await listOpenMergeRequests(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'get_merge_request_details',
    {
      title: 'Get Merge Request Details',
      description: 'Get details about a specific merge request of a project like title, source-branch, target-branch, web_url, ...',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        verbose: z.boolean().optional()
      }
    },
    async (args) => {
      try {
        return await getMergeRequestDetails(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'get_merge_request_comments',
    {
      title: 'Get Merge Request Comments',
      description: 'Get general and file diff comments of a certain merge request',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        verbose: z.boolean().optional()
      }
    },
    async (args) => {
      try {
        return await getMergeRequestComments(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'add_merge_request_comment',
    {
      title: 'Add Merge Request Comment',
      description: 'Add a general comment to a merge request',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        comment: z.string()
      }
    },
    async (args) => {
      try {
        return await addMergeRequestComment(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'add_merge_request_diff_comment',
    {
      title: 'Add Merge Request Diff Comment',
      description: 'Add a comment of a merge request at a specific line in a file diff',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        comment: z.string(),
        base_sha: z.string(),
        start_sha: z.string(),
        head_sha: z.string(),
        file_path: z.string(),
        line_number: z.string()
      }
    },
    async (args) => {
      try {
        return await addMergeRequestDiffComment(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'get_merge_request_diff',
    {
      title: 'Get Merge Request Diff',
      description: 'Get the file diffs of a certain merge request',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number()
      }
    },
    async (args) => {
      try {
        return await getMergeRequestDiff(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'get_issue_details',
    {
      title: 'Get Issue Details',
      description: 'Get details of an issue within a certain project',
      inputSchema: {
        project_id: z.number(),
        issue_iid: z.number(),
        verbose: z.boolean().optional()
      }
    },
    async (args) => {
      try {
        return await getIssueDetails(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'set_merge_request_description',
    {
      title: 'Set Merge Request Description',
      description: 'Set the description of a merge request',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        description: z.string()
      }
    },
    async (args) => {
      try {
        return await setMergeRequestDescription(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  server.registerTool(
    'set_merge_request_title',
    {
      title: 'Set Merge Request Title',
      description: 'Set the title of a merge request',
      inputSchema: {
        project_id: z.number(),
        merge_request_iid: z.number(),
        title: z.string()
      }
    },
    async (args) => {
      try {
        return await setMergeRequestTitle(args);
      } catch (error) {
        return formatErrorResponse(error as Error);
      }
    }
  );

  return server;
}

async function getProjects(args: ToolHandlerArgs): Promise<MCPResponse> {
  const { verbose = false } = args;
  const projectFilter: ProjectFilter = {
    ...(config.minAccessLevel ? { minAccessLevel: parseInt(config.minAccessLevel, 10) } : {}),
    ...(config.projectSearchTerm ? { search: config.projectSearchTerm } : {}),
  };
  
  const projects = await api.Projects.all({ membership: true, ...projectFilter });
  const filteredProjects = verbose ? projects : projects.map((project): FilteredProject => ({
    id: project.id as number,
    description: project.description as string | null,
    name: project.name as string,
    path: project.path as string,
    path_with_namespace: project.path_with_namespace as string,
    web_url: project.web_url as string, 
    default_branch: project.default_branch as string,
  }));

  const projectsText = Array.isArray(filteredProjects) && filteredProjects.length > 0
    ? JSON.stringify(filteredProjects, null, 2)
    : "No projects found.";
  
  return {
    content: [{ type: "text", text: projectsText }],
  };
}

async function listOpenMergeRequests(args: ToolHandlerArgs): Promise<MCPResponse> {
  const { verbose = false, project_id } = args;
  if (!project_id) {
    throw new Error("project_id is required");
  }

  const mergeRequests = await api.MergeRequests.all({ projectId: project_id, state: 'opened' });

  const filteredMergeRequests = verbose ? mergeRequests : mergeRequests.map((mr): FilteredMergeRequest => ({
    iid: mr.iid as number,
    project_id: mr.project_id as number,
    title: mr.title as string,
    description: mr.description as string | null,
    state: mr.state as string,
    web_url: mr.web_url as string,
  }));
  
  return {
    content: [{ type: "text", text: JSON.stringify(filteredMergeRequests, null, 2) }],
  };
}

async function getMergeRequestDetails(args: ToolHandlerArgs): Promise<MCPResponse> {
  const { project_id, merge_request_iid, verbose = false } = args;
  if (!project_id || !merge_request_iid) {
    throw new Error("project_id and merge_request_iid are required");
  }

  const mr = await api.MergeRequests.show(project_id, merge_request_iid);
  const filteredMr = verbose ? mr : {
    title: mr.title as string,
    description: mr.description as string | null,
    state: mr.state as string,
    web_url: mr.web_url as string,
    target_branch: mr.target_branch as string,
    source_branch: mr.source_branch as string,
    merge_status: mr.merge_status as string,
    detailed_merge_status: mr.detailed_merge_status as string,
    diff_refs: mr.diff_refs,
  } satisfies FilteredMergeRequestDetails;
  
  return {
    content: [{ type: "text", text: JSON.stringify(filteredMr, null, 2) }],
  };
}

async function getMergeRequestComments(args: ToolHandlerArgs): Promise<MCPResponse> {
  const { project_id, merge_request_iid, verbose = false } = args;
  if (!project_id || !merge_request_iid) {
    throw new Error("project_id and merge_request_iid are required");
  }

  const discussions = await api.MergeRequestDiscussions.all(project_id, merge_request_iid);
  
  if (verbose) {
    return {
      content: [{ type: "text", text: JSON.stringify(discussions, null, 2) }],
    };
  }
  
  const unresolvedNotes = discussions.flatMap(note => note.notes as unknown[]).filter((note: any) => note.resolved === false);
  const disscussionNotes: FilteredDiscussionNote[] = unresolvedNotes.filter((note: any) => note.type === "DiscussionNote").map((note: any) => ({
    id: note.id as number,
    noteable_id: note.noteable_id as number,
    body: note.body as string,
    author_name: note.author?.name as string,
  }));
  const diffNotes: FilteredDiffNote[] = unresolvedNotes.filter((note: any) => note.type === "DiffNote").map((note: any) => ({
    id: note.id as number,
    noteable_id: note.noteable_id as number,
    body: note.body as string,
    author_name: note.author?.name as string,
    position: note.position,
  }));
  
  const filteredComments: FilteredComments = { 
    disscussionNotes,
    diffNotes
  };
  
  return {
    content: [{ type: "text", text: JSON.stringify(filteredComments, null, 2) }],
  };
}

async function addMergeRequestComment({ project_id, merge_request_iid, comment }: ToolHandlerArgs): Promise<MCPResponse> {
  if (!project_id || !merge_request_iid || !comment) {
    throw new Error("project_id, merge_request_iid, and comment are required");
  }

  const note = await api.MergeRequestDiscussions.create(project_id, merge_request_iid, comment);
  return {
    content: [{ type: "text", text: JSON.stringify(note, null, 2) }],
  };
}

async function addMergeRequestDiffComment({ 
  project_id, 
  merge_request_iid, 
  comment, 
  base_sha, 
  start_sha, 
  head_sha, 
  file_path, 
  line_number 
}: ToolHandlerArgs): Promise<MCPResponse> {
  if (!project_id || !merge_request_iid || !comment || !base_sha || !start_sha || !head_sha || !file_path || !line_number) {
    throw new Error("project_id, merge_request_iid, comment, base_sha, start_sha, head_sha, file_path, and line_number are required");
  }

  const discussion = await api.MergeRequestDiscussions.create(
    project_id, 
    merge_request_iid, 
    comment,
    {
      position: {
        baseSha: base_sha,
        startSha: start_sha,
        headSha: head_sha,
        oldPath: file_path,
        newPath: file_path,
        positionType: 'text' as const,
        newLine: line_number,
      },
    }
  );
  
  return {
    content: [{ type: "text", text: JSON.stringify(discussion, null, 2) }],
  };
}

async function getMergeRequestDiff({ project_id, merge_request_iid }: ToolHandlerArgs): Promise<MCPResponse> {
  if (!project_id || !merge_request_iid) {
    throw new Error("project_id and merge_request_iid are required");
  }

  const diff = await api.MergeRequests.allDiffs(project_id, merge_request_iid);
  const diffText = Array.isArray(diff) && diff.length > 0
    ? JSON.stringify(diff, null, 2)
    : "No diff data available for this merge request.";
  
  return {
    content: [{ type: "text", text: diffText }],
  };
}

async function getIssueDetails(args: ToolHandlerArgs): Promise<MCPResponse> {
  const { project_id, issue_iid, verbose = false } = args;
  if (!project_id || !issue_iid) {
    throw new Error("project_id and issue_iid are required");
  }

  const issue = await api.Issues.show(issue_iid, { projectId: project_id });

  const filteredIssue = verbose ? issue : {
    title: issue.title as string,
    description: issue.description as string | null,
  } satisfies FilteredIssue;

  return {
    content: [{ type: "text", text: JSON.stringify(filteredIssue, null, 2) }],
  };
}

async function setMergeRequestDescription({ project_id, merge_request_iid, description }: ToolHandlerArgs): Promise<MCPResponse> {
  if (!project_id || !merge_request_iid || !description) {
    throw new Error("project_id, merge_request_iid, and description are required");
  }

  const mr = await api.MergeRequests.edit(project_id, merge_request_iid, { description });
  return {
    content: [{ type: "text", text: JSON.stringify(mr, null, 2) }],
  };
}

async function setMergeRequestTitle({ project_id, merge_request_iid, title }: ToolHandlerArgs): Promise<MCPResponse> {
  if (!project_id || !merge_request_iid || !title) {
    throw new Error("project_id, merge_request_iid, and title are required");
  }

  const mr = await api.MergeRequests.edit(project_id, merge_request_iid, { title });
  return {
    content: [{ type: "text", text: JSON.stringify(mr, null, 2) }],
  };
}

async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    const server = createServer();
    await server.connect(transport);
    console.error("[MCP] GitLab MR MCP server started successfully");
  } catch (error) {
    console.error("Failed to start server:", (error as Error).message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}