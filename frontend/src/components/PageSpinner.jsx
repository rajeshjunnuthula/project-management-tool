export default function PageSpinner() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 items-center justify-center px-8 py-20">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-primary" />
    </main>
  );
}
