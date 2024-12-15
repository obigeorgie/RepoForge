import { Switch, Route } from "wouter";
import { NavBar } from "@/components/NavBar";
import { Home } from "@/pages/Home";
import { Profile } from "@/pages/Profile";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
