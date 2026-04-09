import { redirect } from "next/navigation";

export default function PublicRepositoriesPage() {
  redirect("/app/repositories");
}
