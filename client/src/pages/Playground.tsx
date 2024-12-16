import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code2, Terminal, Laptop } from "lucide-react";

const IDEOptions = [
  {
    name: "Replit",
    description: "Collaborative browser-based IDE with support for 50+ languages",
    icon: Terminal,
    link: "https://replit.com/~", // Replace with your affiliate link
    features: ["Browser-based development", "Real-time collaboration", "Integrated hosting"]
  },
  {
    name: "CodeSandbox",
    description: "Instant development environments for web applications",
    icon: Code2,
    link: "https://codesandbox.io/", // Replace with your affiliate link
    features: ["Web-focused development", "Instant preview", "Template library"]
  },
  {
    name: "GitPod",
    description: "Cloud development environments integrated with GitHub",
    icon: Laptop,
    link: "https://gitpod.io/", // Replace with your affiliate link
    features: ["GitHub integration", "Cloud workspaces", "VS Code experience"]
  }
];

export function Playground() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-4">
            Virtual Development Environments
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Experience seamless cloud-based development with our recommended virtual IDE platforms. 
            Write, test, and deploy code directly in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {IDEOptions.map((ide) => {
            const Icon = ide.icon;
            return (
              <Card key={ide.name} className="border-2 border-primary/20 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <CardTitle>{ide.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400">{ide.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-primary">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {ide.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-400">{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90"
                    asChild
                  >
                    <a href={ide.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Try {ide.name}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
