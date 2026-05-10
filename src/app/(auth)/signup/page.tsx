import Image from "next/image";
import Link from "next/link";

import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";

export default async function Page() {
  await requireUnauth();

  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-start p-6 pt-16 md:p-10 md:pt-20">
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-md">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 self-center rounded-md px-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/logos/logo.svg"
            alt="Aether Flow"
            width={78}
            height={32}
          />
          Aether Flow
        </Link>
        <RegisterForm />
      </div>
    </main>
  );
}
