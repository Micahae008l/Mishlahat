import { createFileRoute, redirect } from "@tanstack/react-router";

/** Single auth flow lives at /post-signup; `#login` opens it on the email step. */
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/post-signup", hash: "login" });
  },
});
