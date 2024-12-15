export type Platform = 'github' | 'gitlab' | 'bitbucket';

export interface Repository {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
  platform: Platform;
  platformSpecific?: {
    githubId?: string;
    gitlabId?: number;
    bitbucketId?: string;
  };
  aiSuggestions?: Array<{
    use_case?: string;
    description?: string;
  }>;
  aiAnalysis?: {
    suggestions: Array<{
      use_case?: string;
      description?: string;
    }>;
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

export async function getTrendingRepos(
  platform: Platform = "github",
  language: string = "All",
  sortBy: string = "stars",
  minStars: number = 100
): Promise<Repository[]> {
  const params = new URLSearchParams();
  params.append("platform", platform);
  if (language !== "All") params.append("language", language);
  params.append("sort", sortBy);
  params.append("minStars", minStars.toString());
  
  const response = await fetch(`/api/trending?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch trending repositories from ${platform}`);
  }

  return response.json();
}
