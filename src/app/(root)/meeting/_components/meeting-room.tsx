import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { LayoutList, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import EndCallButton from "./end-call-button";
import Loader from "@/components/loader";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

export default function MeetingRoom() {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const router = useRouter();
  const { user } = useUser();

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition={"left"} />;
      default:
        return <SpeakerLayout participantsBarPosition={"right"} />;
    }
  };

  if (callingState !== CallingState.JOINED) return <Loader />;

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>

        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            block: showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap">
        <CallControls
          onLeave={
            user?.id
              ? () => router.push("/")
              : () => router.push(`/meeting/message`)
          }
        />

        <CallStatsButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full cursor-pointer text-white bg-[#19232d] hover:bg-[#323b44]"
            >
              <LayoutList size={20} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="rounded-2xl p-2 min-w-[150px]"
            align="start"
          >
            <DropdownMenuGroup>
              {[
                { label: "Grid", value: "grid" },
                { label: "Speaker Left", value: "speaker-left" },
                { label: "Speaker Right", value: "speaker-right" },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  className="cursor-pointer rounded-lg px-3 py-2"
                  onClick={() => setLayout(item.value as CallLayoutType)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setShowParticipants((prev) => !prev)}
          variant="secondary"
          size="icon"
          className="rounded-full cursor-pointer text-white bg-[#19232d] hover:bg-[#323b44]"
        >
          <Users size={20} className="text-white" />
        </Button>

        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
}
