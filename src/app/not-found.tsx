import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { en } from "@/i18n/en";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestion className="size-12 text-accent" aria-hidden />
      <h1 className="font-mono text-xl font-bold text-text">{en.errors.notFoundTitle}</h1>
      <p className="max-w-md text-sm text-muted">{en.errors.notFoundBody}</p>
      <Link
        href="/"
        className="flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-5 font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {en.errors.backHome}
      </Link>
    </main>
  );
}
