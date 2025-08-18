import { ThemeProvider } from "@/components/theme-provider";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "@/styles/stream-theme.css";

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
