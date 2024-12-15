import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepoCard } from "@/components/RepoCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function Profile() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/me"],
  });

  const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ["/api/bookmarks"],
  });

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user?.username}</h1>
              <p className="text-gray-400">{user?.bio}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="bookmarks">
        <TabsList>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookmarks">
          {isLoadingBookmarks ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks?.map((repo) => (
                <RepoCard key={repo.name} repo={repo} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="collections">
          <div className="text-center text-gray-400 py-12">
            Collections feature coming soon!
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
