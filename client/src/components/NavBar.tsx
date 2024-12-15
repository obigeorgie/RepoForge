import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Search, BookMarked, User } from "lucide-react";
import { Link } from "wouter";

export function NavBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Github className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  TrendHub AI
                </span>
              </a>
            </Link>
            
            <div className="hidden md:block w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search repositories..."
                  className="w-full pl-10 bg-gray-800/50"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
