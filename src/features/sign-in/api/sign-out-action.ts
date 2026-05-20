"use server";

import { redirect } from "next/navigation";

import { httpClient, endpoints } from "@/shared/api/http-client";
import { getAccessToken, deleteSession } from "@/shared/auth/session";
import { routes } from "@/shared/config";

export async function signOutAction(): Promise<void> {
  const accessToken = await getAccessToken();

  if (accessToken) {
    try {
      await httpClient(endpoints.auth.logout, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Best-effort: clear session even if backend call fails
    }
  }

  await deleteSession();

  redirect(routes.login);
}
