import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Search, BookMarked, User, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function NavBar() {
  const { data: user } = useQuery({
    queryKey: ["/api/me"],
  });
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="flex items-center space-x-3 group relative">
                <div className="relative">
                  <div className="relative">
                    <Github className="h-8 w-8 text-gray-200 transform group-hover:scale-110 transition-all duration-300" />
                    {/* Anvil base shape using CSS */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full blur-[2px] opacity-80" />
                    {/* Animated sparks */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight">
                    <span className="text-gray-200 font-light">Repo</span>
                    <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent font-bold">Forge</span>
                  </span>
                  <span className="text-xs text-gray-400 tracking-wide">Forge the future with trending repositories</span>
                </div>
                {/* Hover glow effect */}
                <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </a>
            </Link>
            
            <div className="hidden md:block w-96">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-hover:text-primary transition-colors duration-300" />
                <Input
                  placeholder="🔍 Find awesome projects..."
                  className="w-full pl-10 bg-gray-800/50 border-gray-700 focus:border-primary/50 transition-all duration-300"
                />
                {/* Search bar glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm rounded-md" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/bookmarks">
                    <a className="flex items-center space-x-2">
                      <BookMarked size={20} />
                      <span className="hidden md:inline">Bookmarks</span>
                    </a>
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild>
                  <Link href="/profile">
                    <a className="flex items-center space-x-2">
                      <User size={20} />
                      <span className="hidden md:inline">Profile</span>
                    </a>
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="default" asChild>
                <a href="/api/auth/github" className="flex items-center space-x-2">
                  <LogIn size={20} />
                  <span>Login with GitHub</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
