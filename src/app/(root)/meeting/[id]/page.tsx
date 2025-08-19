"use client";

import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import React, { useEffect, useState } from "react";
import MeetingSetup from "../_components/meeting-setup";
import MeetingRoom from "../_components/meeting-room";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "@/components/loader";
import { useTheme } from "next-themes";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);
  const { theme, setTheme } = useTheme();

  const [previousTheme, setPreviousTheme] = useState<string | undefined>();

  useEffect(() => {
    if (!theme) return;
    setPreviousTheme(theme);
    setTheme("dark");

    return () => {
      if (previousTheme) {
        setTheme(previousTheme);
      }
    };
  }, [setTheme]);

  if (!isLoaded || isCallLoading) return <Loader />;

  return (
    <main className="w-full min-h-dvh">
      <StreamCall call={call}>
        <StreamTheme as="main" className={theme === "dark" ? "dark" : "light"}>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
