// GitHub API Service for real GitHub integration

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  default_branch: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubWorkflow {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | 'timed_out' | 'action_required' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_commit: {
    id: string;
    message: string;
  };
  run_number: number;
  workflow_id: number;
  event: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  company: string | null;
}

class GitHubService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('github_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('github_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('github_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async fetchGitHub<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not set. Please authenticate first.');
    }

    console.log(`[GitHub API] Fetching: ${endpoint}`);

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[GitHub API] Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`[GitHub API] Error:`, error);
      throw new Error(`GitHub API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[GitHub API] Response data:`, data);
    return data;
  }

  // Get authenticated user info
  async getCurrentUser(): Promise<GitHubUser> {
    return this.fetchGitHub<GitHubUser>('/user');
  }

  // Get user's repositories
  async getUserRepos(options?: { sort?: 'created' | 'updated' | 'pushed' | 'full_name'; per_page?: number }): Promise<GitHubRepo[]> {
    const params = new URLSearchParams();
    if (options?.sort) params.append('sort', options.sort);
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    params.append('affiliation', 'owner,collaborator,organization_member');
    
    return this.fetchGitHub<GitHubRepo[]>(`/user/repos?${params.toString()}`);
  }

  // Get organization repositories
  async getOrgRepos(org: string, options?: { per_page?: number }): Promise<GitHubRepo[]> {
    const params = new URLSearchParams();
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    
    return this.fetchGitHub<GitHubRepo[]>(`/orgs/${org}/repos?${params.toString()}`);
  }

  // Get repository details
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.fetchGitHub<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  // Get branches for a repository
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.fetchGitHub<GitHubBranch[]>(`/repos/${owner}/${repo}/branches`);
  }

  // Get commits for a repository
  async getCommits(owner: string, repo: string, options?: { branch?: string; per_page?: number }): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (options?.branch) params.append('sha', options.branch);
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    
    return this.fetchGitHub<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params.toString()}`);
  }

  // Get all workflows for a repository
  async getWorkflows(owner: string, repo: string): Promise<{ workflows: GitHubWorkflow[] }> {
    return this.fetchGitHub<{ workflows: GitHubWorkflow[] }>(`/repos/${owner}/${repo}/actions/workflows`);
  }

  // Get workflow runs for a repository
  async getWorkflowRuns(owner: string, repo: string, options?: { per_page?: number; branch?: string; status?: string }): Promise<{ workflow_runs: GitHubWorkflowRun[]; total_count: number }> {
    const params = new URLSearchParams();
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    if (options?.branch) params.append('branch', options.branch);
    if (options?.status) params.append('status', options.status);
    
    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/actions/runs${queryString ? '?' + queryString : ''}`;
    
    return this.fetchGitHub<{ workflow_runs: GitHubWorkflowRun[]; total_count: number }>(endpoint);
  }

  // Get workflow runs for a specific workflow
  async getWorkflowRunsForWorkflow(owner: string, repo: string, workflowId: number, options?: { per_page?: number }): Promise<{ workflow_runs: GitHubWorkflowRun[]; total_count: number }> {
    const params = new URLSearchParams();
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    
    return this.fetchGitHub<{ workflow_runs: GitHubWorkflowRun[]; total_count: number }>(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?${params.toString()}`);
  }

  // Get specific workflow run
  async getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    return this.fetchGitHub<GitHubWorkflowRun>(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  // Trigger a workflow
  async triggerWorkflow(owner: string, repo: string, workflowId: string | number, ref: string): Promise<void> {
    await this.fetchGitHub(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref }),
    });
  }

  // Parse repository full name (owner/repo) from various formats
  parseRepoString(repoString: string): { owner: string; repo: string } {
    const parts = repoString.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid repository format. Expected "owner/repo"');
    }
    return { owner: parts[0], repo: parts[1] };
  }
}

// Export singleton instance
export const githubService = new GitHubService();