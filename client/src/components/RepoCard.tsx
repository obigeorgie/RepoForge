import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Users, BookmarkPlus, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface RepoCardProps {
  repo: {
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    url: string;
    aiSuggestions?: string[];
  };
  onBookmark?: () => void;
}

export function RepoCard({ repo, onBookmark }: RepoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-primary/50 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {repo.name}
              </h3>
              <Badge variant="secondary" className="mt-2">
                {repo.language}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star size={16} />
                <span className="text-sm">{repo.stars}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-500">
                <GitFork size={16} />
                <span className="text-sm">{repo.forks}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">{repo.description}</p>
          
          {repo.aiSuggestions && Array.isArray(repo.aiSuggestions) && repo.aiSuggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-primary mb-2">AI Suggestions</h4>
              <ul className="space-y-1">
                {repo.aiSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-gray-400 leading-relaxed">
                    • {typeof suggestion === 'string' ? suggestion : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={onBookmark}>
            <BookmarkPlus size={16} className="mr-2" />
            Save
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              <Share2 size={16} className="mr-2" />
              View
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}