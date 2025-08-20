"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DeviceSettings,
  useCall,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export default function MeetingSetup({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) {
  const [isMicCamToggledOn, setIsMicCamToggledOn] = useState<boolean>(false);

  const call = useCall();

  if (!call)
    throw new Error("usecall must be used within StreamCall component!");

  useEffect(() => {
    if (isMicCamToggledOn) {
      call?.microphone?.disable();
      call?.camera?.disable();
    } else {
      call?.microphone?.enable();
      call?.camera?.enable();
    }
  }, [isMicCamToggledOn, call?.camera, call?.microphone]);

  return (
    <section className="flex flex-col min-h-dvh items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Setup</h1>
      <VideoPreview />

      <div className="flex h-16 items-center justify-center gap-3">
        <Checkbox
          id="mic-cam-toggle"
          checked={!isMicCamToggledOn}
          onCheckedChange={(checked) => setIsMicCamToggledOn(checked === false)}
        />
        <Label htmlFor="mic-cam-toggle">Join with mic and camera</Label>

        <DeviceSettings />
      </div>

      <Button
        className="rounded-md px-4 py-2.5"
        onClick={() => {
          call?.join();

          setIsSetupComplete(true);
        }}
      >
        Join Meeting
      </Button>
    </section>
  );
}
