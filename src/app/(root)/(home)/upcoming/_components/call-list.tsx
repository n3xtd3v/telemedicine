"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Call,
  CallRecording,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import Loader from "@/components/loader";
import MeetingCard from "./meeting-card";
import {
  CalendarClock,
  CalendarSearch,
  Video,
  Play,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import {
  format,
  formatISO,
  startOfDay,
  endOfDay,
  startOfToday,
} from "date-fns";

type RecordingWithMeta = CallRecording & {
  topic?: string;
  description?: string;
  invites?: string[];
  startsAt?: Date;
  url?: string;
};

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user, isLoaded } = useUser();
  const client = useStreamVideoClient();
  const router = useRouter();
  const pathname = usePathname();

  const renderDate = (meeting: Call | RecordingWithMeta) => {
    const date =
      (meeting as Call).state?.startsAt ||
      (meeting as RecordingWithMeta).startsAt ||
      new Date();
    return format(date, "EEEE, MMM d, yyyy, hh:mm a");
  };

  const { data: upcomingCalls = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ["calls", "upcoming", user?.id, selectedDate?.toISOString()],
    queryFn: async (): Promise<Call[]> => {
      if (!client || !user?.id || !selectedDate) return [];

      const start = formatISO(startOfDay(selectedDate));
      const end = formatISO(endOfDay(selectedDate));

      const { calls } = await client.queryCalls({
        sort: [{ field: "starts_at", direction: 1 }],
        filter_conditions: {
          $and: [
            { starts_at: { $gte: start } },
            { starts_at: { $lte: end } },
            {
              $or: [
                { created_by_user_id: user.id },
                { members: { $in: [user.id] } },
              ],
            },
          ],
        },
      });

      const now = new Date();
      return calls
        .filter(
          ({ state: { startsAt } }) => startsAt && new Date(startsAt) > now
        )
        .sort(
          (a, b) =>
            new Date(a.state.startsAt!).getTime() -
            new Date(b.state.startsAt!).getTime()
        );
    },
    enabled:
      type === "upcoming" &&
      isLoaded &&
      !!user?.id &&
      !!client &&
      !!selectedDate,
    refetchInterval: 60 * 1000,
  });

  const { data: endedCalls = [], isLoading: loadingEnded } = useQuery({
    queryKey: ["calls", "ended", user?.id, selectedDate?.toISOString()],
    queryFn: async (): Promise<Call[]> => {
      if (!client || !user?.id || !selectedDate) return [];

      const start = formatISO(startOfDay(selectedDate));
      const end = formatISO(endOfDay(selectedDate));

      const { calls } = await client.queryCalls({
        sort: [{ field: "starts_at", direction: -1 }],
        filter_conditions: {
          $and: [
            { starts_at: { $gte: start } },
            { starts_at: { $lte: end } },
            {
              $or: [
                { created_by_user_id: user.id },
                { members: { $in: [user.id] } },
              ],
            },
          ],
        },
      });

      return calls;
    },
    enabled:
      type === "ended" && isLoaded && !!user?.id && !!client && !!selectedDate,
    refetchInterval: 60 * 1000,
  });

  const { data: callRecordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: [user?.id, selectedDate?.toISOString()],
    queryFn: async (): Promise<RecordingWithMeta[]> => {
      if (!client || !user?.id || !selectedDate) return [];

      const start = formatISO(startOfDay(selectedDate));
      const end = formatISO(endOfDay(selectedDate));

      const { calls } = await client.queryCalls({
        sort: [{ field: "starts_at", direction: -1 }],
        filter_conditions: {
          $and: [
            { starts_at: { $gte: start } },
            { starts_at: { $lte: end } },
            {
              $or: [
                { created_by_user_id: user.id },
                { members: { $in: [user.id] } },
              ],
            },
          ],
        },
      });

      const recordings = await Promise.all(
        calls.map(async (call) => {
          const rec = await call.queryRecordings();
          return rec.recordings.map((r) => ({
            ...r,
            topic: call.state?.custom?.topic,
            description: call.state?.custom?.description,
            invites: call.state?.custom?.invites,
            startsAt: call.state?.startsAt,
            url: r.url,
          }));
        })
      );

      return recordings.flat() as RecordingWithMeta[];
    },
    enabled:
      type === "recordings" &&
      isLoaded &&
      !!user?.id &&
      !!client &&
      !!selectedDate,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {pathname !== "/" && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="pl-3 text-left font-normal">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "M/d/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-1 border-none rounded-none"
              align="start"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsPopoverOpen(false);
                  }
                }}
                disabled={(date) =>
                  type === "upcoming"
                    ? date < startOfToday()
                    : type === "ended"
                    ? date > startOfToday()
                    : false
                }
                className="rounded-md border shadow-sm"
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {calls.length > 0 ? (
          calls.map((meeting, idx) => {
            const isRecording = type === "recordings";

            return (
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
                topic={
                  isRecording
                    ? (meeting as RecordingWithMeta).topic ?? ""
                    : (meeting as Call).state?.custom?.topic ?? ""
                }
                callDescription={
                  isRecording
                    ? (meeting as RecordingWithMeta).description
                    : (meeting as Call).state?.custom?.description
                }
                invites={
                  isRecording
                    ? (meeting as RecordingWithMeta).invites ?? []
                    : (meeting as Call).state?.custom?.invites ?? []
                }
                description={
                  type === "upcoming"
                    ? "Scheduled meeting is about to start."
                    : type === "recordings"
                    ? "This meeting recording is ready to view."
                    : "This meeting has passed its scheduled time."
                }
                date={renderDate(meeting)}
                isPreviousMeeting={type === "ended"}
                link={
                  isRecording
                    ? (meeting as RecordingWithMeta).url ?? "#"
                    : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${
                        (meeting as Call).id
                      }`
                }
                checkList={
                  type === "upcoming"
                    ? (meeting as Call).state?.custom?.checkList
                    : type === "ended"
                    ? (meeting as Call).state?.custom?.checkList
                    : []
                }
                buttonIcon1={isRecording ? <Play /> : <Video />}
                buttonText={isRecording ? "Play" : "Start"}
                handleClick={() =>
                  router.push(
                    isRecording
                      ? (meeting as RecordingWithMeta).url ?? "#"
                      : `/meeting/${(meeting as Call).id}`
                  )
                }
              />
            );
          })
        ) : (
          <h1 className="text-2xl font-bold">{noCallsMessage}</h1>
        )}
      </div>
    </div>
  );
};

export default CallList;
