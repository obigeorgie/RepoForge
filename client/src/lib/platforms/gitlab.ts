import { PlatformClient, defaultParams, buildQueryParams } from "./base";
import type { Repository } from "@/lib/types";

export class GitLabClient implements PlatformClient {
  async getTrendingRepos(options = defaultParams): Promise<Repository[]> {
    const params = buildQueryParams(options);
    params.append("platform", "gitlab");
    
    const response = await fetch(`/api/trending?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch trending repositories from GitLab");
    }

    return response.json();
  }
}
