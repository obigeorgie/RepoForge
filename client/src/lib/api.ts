import { queryClient } from "./queryClient";

export async function bookmarkRepo(repoId: string) {
  const response = await fetch("/api/bookmarks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoId }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to bookmark repository");
  }

  // Invalidate bookmarks query
  await queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });

  return response.json();
}

export async function login(code: string) {
  const response = await fetch("/api/auth/github", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  return response.json();
}
