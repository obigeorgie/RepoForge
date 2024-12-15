export type Platform = 'github' | 'gitlab' | 'bitbucket';

export interface Repository {
  id: number;
  platform: Platform;
  platformId: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  platformData?: {
    github?: {
      owner: string;
      repo: string;
      topics?: string[];
      license?: string;
    };
    gitlab?: {
      namespace: string;
      projectId: number;
      visibility?: string;
    };
    bitbucket?: {
      workspace: string;
      repo_slug: string;
      scm?: string;
    };
  };
  aiAnalysis?: {
    suggestions: string[];
    analyzedAt: string;
    topKeywords?: string[];
    domainCategory?: string;
    trendingScore?: number;
    insights?: {
      trendReason: string;
      ecosystemImpact: string;
      futureOutlook: string;
    };
  };
}

export interface User {
  id: number;
  username: string;
  avatar: string | null;
  bio: string | null;
}

export interface Bookmark {
  id: number;
  userId: number;
  repositoryId: number;
  repository: Repository;
}
