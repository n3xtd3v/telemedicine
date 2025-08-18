import StreamVideoProvider from "@/providers/stream-client-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
}
