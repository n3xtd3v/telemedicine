import { LoaderCircle } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoaderCircle className="animate-spin w-36 h-36" />
    </div>
  );
}
