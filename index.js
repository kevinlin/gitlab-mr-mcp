#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Gitlab } from "@gitbeaker/rest";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import _ from "lodash";

// Promisify exec for async usage
const execAsync = promisify(exec);

// Initialize GitLab API Client
const gitlabToken = process.env.MR_MCP_GITLAB_TOKEN;
if (!gitlabToken) {
  console.error("Error: MR_MCP_GITLAB_TOKEN environment variable is not set.");
}

const api = new Gitlab({
  host: process.env.MR_MCP_GITLAB_HOST,
  token: gitlabToken,
});

// Helper function to format errors for MCP responses
const formatErrorResponse = (error) => ({
  content: [{ type: "text", text: `Error: ${error.message} - ${error.cause?.description || "No additional details"}` }],
  isError: true,
});

export function createServer() {
  const server = new Server(
    { 
      name: 'GitlabMrMCP',
      version: '1.0.0'
    },
    { 
      capabilities: { tools: {} }
    }
  );

  // Tool definitions
  const tools = [
    {
      name: 'get_projects',
      description: 'Get a list of projects with id, name, description, web_url and other useful information.',
      inputSchema: {
        type: 'object',
        properties: {
          verbose: {
            type: 'boolean',
            description: 'By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.',
            default: false
          }
        },
        required: []
      }
    },
    {
      name: 'list_open_merge_requests',
      description: 'List all open merge requests in the project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          verbose: {
            type: 'boolean',
            description: 'By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.',
            default: false
          }
        },
        required: ['project_id']
      }
    },
    {
      name: 'get_merge_request_details',
      description: 'Get details about a specific merge request of a project like title, source-branch, target-branch, web_url, ...',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          verbose: {
            type: 'boolean',
            description: 'By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.',
            default: false
          }
        },
        required: ['project_id', 'merge_request_iid']
      }
    },
    {
      name: 'get_merge_request_comments',
      description: 'Get general and file diff comments of a certain merge request',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          verbose: {
            type: 'boolean',
            description: 'By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.',
            default: false
          }
        },
        required: ['project_id', 'merge_request_iid']
      }
    },
    {
      name: 'add_merge_request_comment',
      description: 'Add a general comment to a merge request',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          comment: {
            type: 'string',
            description: 'The comment text'
          }
        },
        required: ['project_id', 'merge_request_iid', 'comment']
      }
    },
    {
      name: 'add_merge_request_diff_comment',
      description: 'Add a comment of a merge request at a specific line in a file diff',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          comment: {
            type: 'string',
            description: 'The comment text'
          },
          base_sha: {
            type: 'string',
            description: 'The SHA of the base commit'
          },
          start_sha: {
            type: 'string',
            description: 'The SHA of the start commit'
          },
          head_sha: {
            type: 'string',
            description: 'The SHA of the head commit'
          },
          file_path: {
            type: 'string',
            description: 'The path to the file being commented on'
          },
          line_number: {
            type: 'string',
            description: 'The line number in the new version of the file'
          }
        },
        required: ['project_id', 'merge_request_iid', 'comment', 'base_sha', 'start_sha', 'head_sha', 'file_path', 'line_number']
      }
    },
    {
      name: 'get_merge_request_diff',
      description: 'Get the file diffs of a certain merge request',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          }
        },
        required: ['project_id', 'merge_request_iid']
      }
    },
    {
      name: 'get_issue_details',
      description: 'Get details of an issue within a certain project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the issue'
          },
          issue_iid: {
            type: 'number',
            description: 'The internal ID of the issue within the project'
          },
          verbose: {
            type: 'boolean',
            description: 'By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.',
            default: false
          }
        },
        required: ['project_id', 'issue_iid']
      }
    },
    {
      name: 'set_merge_request_description',
      description: 'Set the description of a merge request',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          description: {
            type: 'string',
            description: 'The description text'
          }
        },
        required: ['project_id', 'merge_request_iid', 'description']
      }
    },
    {
      name: 'set_merge_request_title',
      description: 'Set the title of a merge request',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'number',
            description: 'The project ID of the merge request'
          },
          merge_request_iid: {
            type: 'number',
            description: 'The internal ID of the merge request within the project'
          },
          title: {
            type: 'string',
            description: 'The title of the merge request'
          }
        },
        required: ['project_id', 'merge_request_iid', 'title']
      }
    }
  ];

  // Register the handler for listing tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error('[MCP] Handling list tools request');
    return { tools };
  });

  // Register the handler for tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[MCP] Handling tool call: ${name}`, args);

    try {
      let result;

      switch (name) {
        case 'get_projects':
          result = await getProjects(args);
          break;
        
        case 'list_open_merge_requests':
          result = await listOpenMergeRequests(args);
          break;
        
        case 'get_merge_request_details':
          result = await getMergeRequestDetails(args);
          break;
        
        case 'get_merge_request_comments':
          result = await getMergeRequestComments(args);
          break;
        
        case 'add_merge_request_comment':
          result = await addMergeRequestComment(args);
          break;
        
        case 'add_merge_request_diff_comment':
          result = await addMergeRequestDiffComment(args);
          break;
        
        case 'get_merge_request_diff':
          result = await getMergeRequestDiff(args);
          break;
        
        case 'get_issue_details':
          result = await getIssueDetails(args);
          break;
        
        case 'set_merge_request_description':
          result = await setMergeRequestDescription(args);
          break;
        
        case 'set_merge_request_title':
          result = await setMergeRequestTitle(args);
          break;
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      console.error(`[MCP] Tool ${name} completed successfully`);
      
      return result;
    } catch (error) {
      console.error(`[MCP] Tool ${name} failed:`, error);
      return formatErrorResponse(error);
    }
  });

  return server;
}

// Tool implementation functions
async function getProjects({ verbose = false }) {
  const projectFilter = {
    ...(process.env.MR_MCP_MIN_ACCESS_LEVEL ? { minAccessLevel: parseInt(process.env.MR_MCP_MIN_ACCESS_LEVEL, 10) } : {}),
    ...(process.env.MR_MCP_PROJECT_SEARCH_TERM ? { search: process.env.MR_MCP_PROJECT_SEARCH_TERM } : {}),
  }
  const projects = await api.Projects.all({ membership: true, ...projectFilter });
  const filteredProjects = verbose ? projects : projects.map(project => ({
    id: project.id,
    description: project.description,
    name: project.name,
    path: project.path,
    path_with_namespace: project.path_with_namespace,
    web_url: project.web_url, 
    default_branch: project.default_branch,
  }));

  const projectsText = Array.isArray(filteredProjects) && filteredProjects.length > 0
    ? JSON.stringify(filteredProjects, null, 2)
    : "No projects found.";
  return {
    content: [{ type: "text", text: projectsText }],
  };
}

async function listOpenMergeRequests({ verbose = false, project_id }) {
  const mergeRequests = await api.MergeRequests.all({ projectId: project_id, state: 'opened' });

  const filteredMergeRequests = verbose ? mergeRequests : mergeRequests.map(mr => ({
    iid: mr.iid,
    project_id: mr.project_id,
    title: mr.title,
    description: mr.description,
    state: mr.state,
    web_url: mr.web_url,
  }));
  return {
    content: [{ type: "text", text: JSON.stringify(filteredMergeRequests, null, 2) }],
  };
}

async function getMergeRequestDetails({ project_id, merge_request_iid, verbose = false }) {
  const mr = await api.MergeRequests.show(project_id, merge_request_iid);
  const filteredMr = verbose ? mr : {
    title: mr.title,
    description: mr.description,
    state: mr.state,
    web_url: mr.web_url,
    target_branch: mr.target_branch,
    source_branch: mr.source_branch,
    merge_status: mr.merge_status,
    detailed_merge_status: mr.detailed_merge_status,
    diff_refs: mr.diff_refs,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(filteredMr, null, 2) }],
  };
}

async function getMergeRequestComments({ project_id, merge_request_iid, verbose = false }) {
  const discussions = await api.MergeRequestDiscussions.all(project_id, merge_request_iid);
  
  if (verbose) {
    return {
      content: [{ type: "text", text: JSON.stringify(discussions, null, 2) }],
    };
  }
  
  const unresolvedNotes = discussions.flatMap(note => note.notes).filter(note => note.resolved === false);
  const disscussionNotes = unresolvedNotes.filter(note => note.type === "DiscussionNote").map(note => ({
    id: note.id,
    noteable_id: note.noteable_id,
    body: note.body,
    author_name: note.author.name,
  }));
  const diffNotes = unresolvedNotes.filter(note => note.type === "DiffNote").map(note => ({
    id: note.id,
    noteable_id: note.noteable_id,
    body: note.body,
    author_name: note.author.name,
    position: note.position,
  }));
  return {
    content: [{ type: "text", text: JSON.stringify({ 
      disscussionNotes,
      diffNotes
    }, null, 2) }],
  };
}

async function addMergeRequestComment({ project_id, merge_request_iid, comment }) {
  const note = await api.MergeRequestDiscussions.create(project_id, merge_request_iid, comment);
  return {
    content: [{ type: "text", text: JSON.stringify(note, null, 2) }],
  };
}

async function addMergeRequestDiffComment({ project_id, merge_request_iid, comment, base_sha, start_sha, head_sha, file_path, line_number }) {
  const discussion = await api.MergeRequestDiscussions.create(
    project_id, 
    merge_request_iid, 
    comment,
    {
      position: {
        base_sha: base_sha,
        start_sha: start_sha,
        head_sha: head_sha,
        old_path: file_path,
        new_path: file_path,
        position_type: 'text',
        new_line: line_number,
      },
    }
  );
  return {
    content: [{ type: "text", text: JSON.stringify(discussion, null, 2) }],
  };
}

async function getMergeRequestDiff({ project_id, merge_request_iid }) {
  const diff = await api.MergeRequests.allDiffs(project_id, merge_request_iid);
  const diffText = Array.isArray(diff) && diff.length > 0
    ? JSON.stringify(diff, null, 2)
    : "No diff data available for this merge request.";
  return {
    content: [{ type: "text", text: diffText }],
  };
}

async function getIssueDetails({ project_id, issue_iid, verbose = false }) {
  const issue = await api.Issues.show(issue_iid, { projectId: project_id });

  const filteredIssue = verbose ? issue : {
    title: issue.title,
    description: issue.description,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(filteredIssue, null, 2) }],
  };
}

async function setMergeRequestDescription({ project_id, merge_request_iid, description }) {
  const mr = await api.MergeRequests.edit( project_id, merge_request_iid, { description });
  return {
    content: [{ type: "text", text: JSON.stringify(mr, null, 2) }],
  };
}

async function setMergeRequestTitle({ project_id, merge_request_iid, title }) {
  const mr = await api.MergeRequests.edit( project_id, merge_request_iid, { title });
  return {
    content: [{ type: "text", text: JSON.stringify(mr, null, 2) }],
  };
}

// Connect the server to a transport and start it
(async () => {
  try {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const transport = new StdioServerTransport();
    const server = createServer();
    await server.connect(transport);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();