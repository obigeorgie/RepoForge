import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepoCard } from "@/components/RepoCard";
import { bookmarkRepo } from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Platform } from "@/lib/types";
import { getPlatformClient } from "@/lib/platforms";

const platforms = ["github", "gitlab", "bitbucket"] as const;
const languages = ["All", "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C++"];
const sortOptions = ["stars", "forks", "recent"];

export function Home() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("github");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [sortBy, setSortBy] = useState("stars");
  const [minStars, setMinStars] = useState("100");

  const { data: repos, isLoading } = useQuery({
    queryKey: ["/api/trending", selectedPlatform, selectedLanguage, sortBy, minStars],
    queryFn: () => getPlatformClient(selectedPlatform).getTrendingRepos({
      language: selectedLanguage,
      sort: sortBy,
      minStars: parseInt(minStars),
    }),
  });

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
          Trending Repositories
        </h1>
        
        <div className="flex space-x-4 items-center">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minStars} onValueChange={setMinStars}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Minimum Stars" />
            </SelectTrigger>
            <SelectContent>
              {["100", "1000", "5000", "10000", "50000"].map(stars => (
                <SelectItem key={stars} value={stars}>
                  {stars}+ stars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos?.map((repo) => (
            <RepoCard
              key={repo.name}
              repo={repo}
              onBookmark={async () => {
                try {
                  await bookmarkRepo(repo.id.toString());
                  toast({
                    title: "Repository bookmarked",
                    description: "You can find it in your profile",
                  });
                } catch (error) {
                  toast({
                    title: "Failed to bookmark repository",
                    description: error instanceof Error ? error.message : "Please try again",
                    variant: "destructive",
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}