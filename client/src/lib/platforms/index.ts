export * from "./base";
export * from "./github";
export * from "./gitlab";
export * from "./bitbucket";

import { GitHubClient } from "./github";
import { GitLabClient } from "./gitlab";
import { BitbucketClient } from "./bitbucket";
import type { Platform } from "@/lib/types";

const clients = {
  github: new GitHubClient(),
  gitlab: new GitLabClient(),
  bitbucket: new BitbucketClient(),
} as const;

export function getPlatformClient(platform: Platform) {
  return clients[platform];
}
