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
              <a className="flex items-center space-x-2 group">
                <div className="relative">
                  <Github className="h-7 w-7 text-gray-200 transform group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">
                    <span className="text-gray-200">Repo</span>
                    <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Forge</span>
                  </span>
                  <span className="text-xs text-gray-400">Forge the future with trending repositories</span>
                </div>
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
