"use client";

import { useRouter } from "next/navigation";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import Loader from "@/components/loader";
import MeetingCard from "./meeting-card";
import { CalendarClock, CalendarSearch, Video, Play } from "lucide-react";
import { UseUpcomingCalls } from "@/hooks/use-upcoming-calls";
import { UseEndedCalls } from "@/hooks/use-ended-calls";
import { UseCallRecordings } from "@/app/(root)/meeting/_components/use-call-recordings";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter();

  const { data: upcomingCalls = [], isLoading: loadingUpcoming } =
    UseUpcomingCalls({ enabled: type === "upcoming" });

  const { data: endedCalls = [], isLoading: loadingEnded } = UseEndedCalls({
    enabled: type === "ended",
  });

  const { data: callRecordings = [], isLoading: loadingRecordings } =
    UseCallRecordings({ enabled: type === "recordings" });
  const isLoading = loadingUpcoming || loadingEnded || loadingRecordings;

  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "upcoming":
        return upcomingCalls;
      case "recordings":
        return callRecordings;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case "ended":
        return "No Previous Calls";
      case "upcoming":
        return "No Upcoming Calls";
      case "recordings":
        return "No Recordings";
      default:
        return "";
    }
  };

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording, idx: number) => (
          <MeetingCard
            key={(meeting as Call).id || idx}
            icon={
              type === "ended" ? (
                <CalendarSearch />
              ) : type === "upcoming" ? (
                <CalendarClock />
              ) : (
                <Video />
              )
            }
            topic={(meeting as Call).state?.custom?.topic}
            callDescription={(meeting as Call).state?.custom?.description}
            invites={(meeting as Call).state?.custom?.invite}
            description={
              type === "upcoming"
                ? "Scheduled meeting is about to start."
                : type === "recordings"
                ? "This meeting recording is ready to view."
                : "This meeting has passed its scheduled time."
            }
            date={
              (meeting as Call).state?.startsAt?.toLocaleString() ||
              (meeting as CallRecording).start_time?.toLocaleString()
            }
            isPreviousMeeting={type === "ended"}
            link={
              type === "recordings"
                ? (meeting as CallRecording).url
                : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${
                    (meeting as Call).id
                  }`
            }
            buttonIcon1={type === "recordings" ? <Play /> : <Video />}
            buttonText={type === "recordings" ? "Play" : "Start"}
            handleClick={
              type === "recordings"
                ? () => router.push(`${(meeting as CallRecording).url}`)
                : () => router.push(`/meeting/${(meeting as Call).id}`)
            }
          />
        ))
      ) : (
        <h1 className="text-2xl font-bold">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
