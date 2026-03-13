import ConfigEditor from "../../../src/components/config-editor/config-editor";

export default async function ProtectedEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string; path?: string }>;
}) {
  const params = await searchParams;

  return <ConfigEditor repository={params.repo ?? ""} path={params.path ?? ""} />;
}
