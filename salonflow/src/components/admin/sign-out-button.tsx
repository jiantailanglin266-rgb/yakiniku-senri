import { signOutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/primitives";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  );
}
