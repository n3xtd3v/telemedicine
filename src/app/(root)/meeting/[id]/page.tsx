"use client";

import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import React, { useState } from "react";
import MeetingSetup from "../_components/meeting-setup";
import MeetingRoom from "../_components/meeting-room";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "@/components/loader";
import { useTheme } from "next-themes";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const { call, isCallLoading } = useGetCallById(id);
  const { theme, setTheme } = useTheme();

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
