import { redirect } from "next/navigation";

import { routes } from "@/shared/config";

export default function RootPage() {
  redirect(routes.dashboard);
}
