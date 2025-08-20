"use client";

import React, { useState } from "react";
import HomeCard from "./home-card";
import {
  CalendarDays,
  ChevronDownIcon,
  Plus,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MeetingModal from "./meeting-modal";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { sendInviteEmail } from "@/lib/send-mail";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const meetingSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  description: z.string().optional(),
  invites: z
    .array(
      z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
    )
    .min(1, "At least one invite is required"),
  link: z.string().optional(),
  dateTime: z.date(),
});
type MeetingFormType = z.infer<typeof meetingSchema>;

export default function MeetingTypeList() {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const queryClient = useQueryClient();

  const [meeting, setMeeting] = useState<
    "isScheduledMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();
  const [open, setOpen] = useState(false);

  const { control, handleSubmit, setValue, watch, reset } =
    useForm<MeetingFormType>({
      resolver: zodResolver(meetingSchema),
      defaultValues: {
        topic: "",
        description: "",
        invites: [],
        link: "",
        dateTime: new Date(),
      },
    });

  const values = watch();
  const [timeString, setTimeString] = useState(
    values.dateTime.toTimeString().slice(0, 5)
  );

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(values.dateTime);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (isNaN(hours) || isNaN(minutes)) return;

    const currentDate = new Date(values.dateTime);
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);

    setValue("dateTime", currentDate);
    setTimeString(e.target.value);
  };

  // Mutation แบบ React Query
  const createMeetingMutation = useMutation<
    { call: Call; meetingType: string },
    Error,
    MeetingFormType & { meetingType: string }
  >({
    mutationFn: async (formValues) => {
      if (!client || !user) throw new Error("No client or user");

      const id = crypto.randomUUID();
      const startAt = formValues.dateTime.toISOString();
      const topic = `${formValues.topic} TeleMed Meeting`;
      const description = formValues.description || "Instant meeting";

      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create call! 😱");

      const res = await call.getOrCreate({
        data: {
          starts_at: startAt,
          custom: { topic, description, invite: formValues.invites },
        },
      });

      if (res.created && formValues.meetingType === "isScheduledMeeting") {
        sendInviteEmail({
          to: formValues.invites,
          topic: res.call.custom.topic,
          description: res.call.custom.description,
          link: `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`,
          starts_at: new Date(`${res.call.starts_at}`),
        });
      }

      return { call, meetingType: formValues.meetingType };
    },
    onSuccess: ({ call, meetingType }) => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setMeeting(undefined);
      reset();

      if (meetingType === "isInstantMeeting") {
        router.push(`/meeting/${call.id}`);
      }

      toast.success("Success", {
        description: "Meeting created successfully. 🎉",
        id: "create-meeting",
      });
    },
    onError: (err) => {
      console.log(err);
      toast.error("Error", {
        description: "Failed to create meeting! 😱",
        id: "create-meeting",
      });
    },
  });

  const handleCreateMeeting = (formValues: MeetingFormType, type: string) => {
    createMeetingMutation.mutate({ ...formValues, meetingType: type });
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-2">
      <HomeCard
        title="New Meeting"
        des="Start an Instant Meeting"
        icon={<Plus className="w-20 h-20" />}
        handleClick={() => setMeeting("isInstantMeeting")}
      />
      <HomeCard
        title="Schedule Meeting"
        des="Plan your meeting"
        icon={<CalendarDays className="w-20 h-20" />}
        handleClick={() => setMeeting("isScheduledMeeting")}
      />
      <HomeCard
        title="View Recordings"
        des="Check out your recordings"
        icon={<Video className="w-20 h-20" />}
        handleClick={() => router.push("/recordings")}
      />
      <HomeCard
        title="Join Meeting"
        des="via invitation link"
        icon={<UserPlus className="w-20 h-20" />}
        handleClick={() => setMeeting("isJoiningMeeting")}
      />

      {/* Scheduled Meeting Modal */}
      <MeetingModal
        isOpen={meeting === "isScheduledMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Create Meeting"
        description="Plan your meeting details before starting."
        handleClick={handleSubmit((formValues) =>
          handleCreateMeeting(formValues, "isScheduledMeeting")
        )}
      >
        <form className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Controller
              name="topic"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={`${
                    user?.fullName || user?.username
                  } TeleMed Meeting`}
                />
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Description" />
              )}
            />
          </div>

          <Controller
            name="invites"
            control={control}
            render={({ field }) => (
              <InviteInput emails={field.value} setEmails={field.onChange} />
            )}
          />

          <div className="flex items-center gap-3">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="date-picker">Date</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="date-picker">
                    {formattedDate}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={values.dateTime}
                    onSelect={(date) => {
                      if (!date) return;
                      const newDate = new Date(date);
                      newDate.setHours(values.dateTime.getHours());
                      newDate.setMinutes(values.dateTime.getMinutes());
                      setValue("dateTime", newDate);
                      setOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time-picker">Time</Label>
              <Input
                type="time"
                id="time-picker"
                step="300"
                value={timeString}
                onChange={handleTimeChange}
              />
            </div>
          </div>
        </form>
      </MeetingModal>

      {/* Instant Meeting Modal */}
      <MeetingModal
        isOpen={meeting === "isInstantMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Start an Instant Meeting"
        description="Start your instant meeting now."
        buttonLabel="Start Meeting"
        handleClick={handleSubmit((formValues) =>
          handleCreateMeeting(formValues, "isInstantMeeting")
        )}
      />

      {/* Join Meeting Modal */}
      <MeetingModal
        isOpen={meeting === "isJoiningMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Type the link here"
        description="Access your personal room using the link below."
        buttonLabel="Join Meeting"
        handleClick={() => router.push(values.link || "")}
      >
        <Controller
          name="link"
          control={control}
          render={({ field }) => (
            <Input placeholder="Meeting link" {...field} />
          )}
        />
      </MeetingModal>
    </section>
  );
}

// InviteInput Component
function InviteInput({
  emails,
  setEmails,
}: {
  emails: string[];
  setEmails: (emails: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!emails.includes(trimmed)) setEmails([...emails, trimmed]);
    setInputValue("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    }
    if (e.key === "Backspace" && inputValue === "" && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="invite">Invite</Label>
      <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 focus-within:ring-2 focus-within:ring-ring">
        {emails.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="flex items-center gap-1 cursor-auto"
            onClick={() => removeEmail(email)}
          >
            {email}
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
        ))}
        <Input
          id="invite"
          className="border-0 shadow-none focus-visible:ring-0 p-2"
          placeholder="example@gmail.com"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <p className="text-muted-foreground text-[14px]">
        Add multiple emails (press Enter, Tab, or comma). Click email to remove.
      </p>
    </div>
  );
}
