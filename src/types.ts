export interface GitLabMRMcpConfig {
  readonly name: string;
  readonly version: string;
  readonly [key: string]: unknown;
}

export interface ToolHandlerArgs {
  readonly verbose?: boolean | undefined;
  readonly project_id?: number;
  readonly merge_request_iid?: number;
  readonly issue_iid?: number;
  readonly comment?: string;
  readonly base_sha?: string;
  readonly start_sha?: string;
  readonly head_sha?: string;
  readonly file_path?: string;
  readonly line_number?: string;
  readonly description?: string;
  readonly title?: string;
}

export interface ProjectFilter {
  readonly minAccessLevel?: number;
  readonly search?: string;
}

export interface FilteredProject {
  readonly id: number;
  readonly description: string | null;
  readonly name: string;
  readonly path: string;
  readonly path_with_namespace: string;
  readonly web_url: string;
  readonly default_branch: string;
}

export interface FilteredMergeRequest {
  readonly iid: number;
  readonly project_id: number;
  readonly title: string;
  readonly description: string | null;
  readonly state: string;
  readonly web_url: string;
}

export interface FilteredMergeRequestDetails {
  readonly title: string;
  readonly description: string | null;
  readonly state: string;
  readonly web_url: string;
  readonly target_branch: string;
  readonly source_branch: string;
  readonly merge_status: string;
  readonly detailed_merge_status: string;
  readonly diff_refs: unknown;
}

export interface FilteredDiscussionNote {
  readonly id: number;
  readonly noteable_id: number;
  readonly body: string;
  readonly author_name: string;
}

export interface FilteredDiffNote extends FilteredDiscussionNote {
  readonly position: unknown;
}

export interface FilteredComments {
  readonly disscussionNotes: FilteredDiscussionNote[];
  readonly diffNotes: FilteredDiffNote[];
}

export interface FilteredIssue {
  readonly title: string;
  readonly description: string | null;
}

export interface MCPResponse {
  readonly content: Array<{ 
    readonly type: "text"; 
    readonly text: string;
    readonly _meta?: { readonly [key: string]: unknown };
  }>;
  readonly isError?: boolean;
  readonly _meta?: { readonly [key: string]: unknown };
  readonly [key: string]: unknown;
}

export interface EnvironmentConfig {
  readonly gitlabToken: string;
  readonly gitlabHost?: string | undefined;
  readonly minAccessLevel?: string | undefined;
  readonly projectSearchTerm?: string | undefined;
}