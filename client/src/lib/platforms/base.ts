import type { Repository } from "@/lib/types";

export interface TrendingOptions {
  language?: string;
  sort?: string;
  minStars?: number;
}

export interface PlatformClient {
  getTrendingRepos(options?: TrendingOptions): Promise<Repository[]>;
}

export const defaultParams: Required<TrendingOptions> = {
  language: "All",
  sort: "stars",
  minStars: 100,
};

export function buildQueryParams(options: typeof defaultParams): URLSearchParams {
  const params = new URLSearchParams();
  
  if (options.language !== "All") {
    params.append("language", options.language);
  }
  
  params.append("sort", options.sort);
  params.append("minStars", options.minStars.toString());
  
  return params;
}
