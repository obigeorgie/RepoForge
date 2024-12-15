import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepoCard } from "@/components/RepoCard";
import { getTrendingRepos } from "@/lib/github";
import { bookmarkRepo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const languages = ["All", "JavaScript", "TypeScript", "Python", "Rust", "Go"];

export function Home() {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  const { data: repos, isLoading } = useQuery({
    queryKey: ["/api/trending", selectedLanguage],
    queryFn: () => getTrendingRepos(selectedLanguage),
  });

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
          Trending Repositories
        </h1>
        
        <div className="flex space-x-4 items-center">
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
