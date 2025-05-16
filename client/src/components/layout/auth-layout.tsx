import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary">LevLetter</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              感謝の気持ちを伝える社内コミュニケーションツール
            </p>
          </div>
          {children}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} LevLetter - All rights reserved
      </footer>
    </div>
  );
}