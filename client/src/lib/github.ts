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

export async function getTrendingRepos(language: string = "All"): Promise<Repository[]> {
  const response = await fetch("/api/trending" + (language !== "All" ? `?language=${language}` : ""));
  
  if (!response.ok) {
    throw new Error("Failed to fetch trending repositories");
  }

  return response.json();
}
