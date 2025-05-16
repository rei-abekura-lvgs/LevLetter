import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        ページが見つかりませんでした
      </p>
      <Button asChild className="mt-4">
        <Link href="/">ホームに戻る</Link>
      </Button>
    </div>
  );
}