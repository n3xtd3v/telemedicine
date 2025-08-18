"use client";

import { useGetCalls } from "@/hooks/useGetCalls";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import Loader from "@/components/loader";
import MeetingCard from "./meeting-card";
import { CalendarClock, CalendarSearch, Video, Play } from "lucide-react";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "recordings":
        return recordings;
      case "upcoming":
        return upcomingCalls;
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

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const callData = await Promise.all(
          callRecordings?.map((meeting) => meeting.queryRecordings()) ?? []
        );

        const recordings = callData
          .filter((call) => call.recordings.length > 0)
          .flatMap((call) => call.recordings);

        setRecordings(recordings);
      } catch (error) {
        toast.error("Error", {
          description: "Try again later! 😱",
          id: "fetch-recordings",
        });
      }
    };

    if (type === "recordings") {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {calls && calls.length > 0 ? (
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
                : type === "ended"
                ? "This meeting has passed its scheduled time, but you can still join."
                : undefined
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
