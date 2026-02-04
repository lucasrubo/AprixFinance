import { redirect } from "next/navigation";

export default function RootPage() {
  // O middleware já cuida do redirecionamento, mas incluímos como fallback
  redirect("/dashboard");
}
