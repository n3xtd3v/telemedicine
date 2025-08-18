"use client";

import { Button } from "@/components/ui/button";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";

export default function EndCallButton() {
  const call = useCall();
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOnwer =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOnwer) return null;

  return (
    <Button
      onClick={async () => {
        await call.endCall();
        router.push("/");
      }}
      className="bg-red-500 text-white font-bold cursor-pointer hover:bg-[#e96962]"
    >
      End call for everyone
    </Button>
  );
}
