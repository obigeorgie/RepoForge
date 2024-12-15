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
                <span className="text-lg" role="img" aria-label="stars">⭐</span>
                <span className="text-sm font-medium">{repo.stars.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-500">
                <span className="text-lg" role="img" aria-label="community score">🤝</span>
                <span className="text-sm font-medium">{repo.forks.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">{repo.description}</p>
          
          {repo.aiAnalysis && (
            <div className="mt-4 space-y-4">
              {repo.aiAnalysis.suggestions && repo.aiAnalysis.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">
                    <span role="img" aria-label="magic wand">✨</span> Cool Things You Can Do
                  </h4>
                  <ul className="space-y-2">
                    {repo.aiAnalysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-400 leading-relaxed flex items-start space-x-2">
                        <span role="img" aria-label="bullet point" className="text-lg">
                          {['🎮', '🚀', '🎨'][i]}
                        </span>
                        <span>{typeof suggestion === 'string' ? suggestion : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {repo.aiAnalysis.trendingScore !== undefined && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/20 p-3 rounded-lg">
                  <span role="img" aria-label="fire" className="text-xl">🔥</span>
                  <div>
                    <h4 className="text-sm font-medium text-primary">Popularity Score</h4>
                    <div className="flex items-center">
                      <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-500"
                          style={{ width: `${repo.aiAnalysis.trendingScore}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs font-medium">{repo.aiAnalysis.trendingScore}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBookmark}
            className="bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 transition-all duration-300"
          >
            <span role="img" aria-label="collect" className="mr-2">📚</span>
            Collect
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="hover:bg-primary/10 transition-all duration-300"
          >
            <a href={repo.url} target="_blank" rel="noopener noreferrer">
              <span role="img" aria-label="explore" className="mr-2">🔍</span>
              Explore
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}