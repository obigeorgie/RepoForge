import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Users, BookmarkPlus, Share2 } from "lucide-react";
import { motion } from "framer-motion";

import type { Repository } from "@/lib/github";

interface RepoCardProps {
  repo: Repository;
  onBookmark?: () => void;
}

export function RepoCard({ repo, onBookmark }: RepoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-primary/50 transition-all relative group">
        {/* Animated glow effect */}
        <div className="absolute inset-px bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm" />
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 group-hover:from-primary group-hover:to-primary/70 transition-all duration-300">
                {repo.name}
              </h3>
              <Badge variant="secondary" className="mt-2 animate-pulse">
                {repo.language || '🌈 Mixed'}
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
          <p className="text-gray-400 group-hover:text-gray-300 transition-all duration-300">{repo.description}</p>
          
          {repo.aiAnalysis?.suggestions && repo.aiAnalysis.suggestions.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="relative">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg -z-10" />
                
                <h4 className="text-sm font-medium bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-2">
                  <span role="img" aria-label="magic wand" className="animate-bounce inline-block">✨</span> AI Adventure Ideas
                </h4>
                <ul className="space-y-2">
                  {repo.aiAnalysis.suggestions.slice(0, 3).map((suggestion: any, i: number) => {
                    const suggestionText = typeof suggestion === 'string' ? suggestion : String(suggestion);
                    return (
                      <li key={i} className="text-sm text-gray-400 leading-relaxed flex items-start space-x-2 group/item hover:text-gray-300 transition-all duration-300">
                        <span role="img" aria-label="bullet point" className="text-lg group-hover/item:scale-110 transition-transform duration-300">
                          {['🎯', '🚀', '💡'][i % 3]}
                        </span>
                        <span className="group-hover/item:translate-x-1 transition-transform duration-300">
                          {suggestionText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {typeof repo.aiAnalysis.trendingScore === 'number' && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/20 p-3 rounded-lg backdrop-blur-sm">
                  <span role="img" aria-label="fire" className="text-xl animate-pulse">🔥</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-primary">Trending Score</h4>
                    <div className="flex items-center mt-1">
                      <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                          style={{ width: `${repo.aiAnalysis.trendingScore}%` }}
                        />
                      </div>
                      <span className="ml-2 text-xs font-medium text-orange-500">{repo.aiAnalysis.trendingScore}/100</span>
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