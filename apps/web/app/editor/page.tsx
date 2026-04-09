import { redirect } from "next/navigation";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string; path?: string }>;
}) {
  const params = await searchParams;
  const repo = params.repo ? `repo=${encodeURIComponent(params.repo)}` : "";
  const path = params.path ? `path=${encodeURIComponent(params.path)}` : "";
  const query = [repo, path].filter(Boolean).join("&");
  redirect(`/app/editor${query ? `?${query}` : ""}`);
}
