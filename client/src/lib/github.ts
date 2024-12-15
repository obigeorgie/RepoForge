export interface Repository {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
  aiSuggestions?: string[];
}

export async function getTrendingRepos(
  language: string = "All",
  sortBy: string = "stars",
  minStars: number = 100
): Promise<Repository[]> {
  const params = new URLSearchParams();
  if (language !== "All") params.append("language", language);
  params.append("sort", sortBy);
  params.append("minStars", minStars.toString());
  
  const response = await fetch(`/api/trending?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch trending repositories");
  }

  return response.json();
}
