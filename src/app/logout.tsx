"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const LogoutButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        authClient.signOut({
          fetchOptions: {
            onSuccess() {
              router.push("/login");
            },
            onError(ctx) {
              toast.error(ctx.error.message);
            },
          },
        });
      }}
    >
      Logout
    </Button>
  );
};
