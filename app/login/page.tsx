import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const hasError = params.error === "1";

  return (
    <div className="flex justify-center pt-16">
      <form action={loginAction} className="grid w-full max-w-sm gap-5 rounded-xl border bg-card p-6">
        <div className="grid gap-1 text-center">
          <h1 className="text-lg font-bold">ログイン</h1>
          <p className="text-sm text-muted-foreground">パスワードを入力してください</p>
        </div>
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">パスワード</span>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
            className="h-9 text-base"
            aria-invalid={hasError || undefined}
          />
          {hasError && <span className="text-sm text-destructive">パスワードが正しくありません</span>}
        </label>
        <Button type="submit" className="h-9">
          ログイン
        </Button>
      </form>
    </div>
  );
}
