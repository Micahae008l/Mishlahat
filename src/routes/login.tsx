import { createFileRoute, redirect } from "@tanstack/react-router";

/** Single auth flow lives at /post-signup (email + OTP). */
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/post-signup" });
  },
});
