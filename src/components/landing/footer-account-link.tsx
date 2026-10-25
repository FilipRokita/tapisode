import Link from "next/link";

/** Both links are in the page, and CSS shows the one that fits the visitor. */
export function FooterAccountLink() {
  return (
    <>
      <Link href="/signin" className="when-out hover:text-foreground">
        Sign in
      </Link>
      <Link href="/app" className="when-in hover:text-foreground">
        Open the app
      </Link>
    </>
  );
}
