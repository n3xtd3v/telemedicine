"use client";

import React, { useState, useRef } from "react";
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
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
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

export default function MeetingTypeList() {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [meeting, setMeeting] = useState<
    "isScheduledMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();

  const [values, setValues] = useState<{
    topic: string;
    description: string | null;
    invites: string[];
    link: string;
    dateTime: Date;
  }>({
    topic: `${user?.fullName || user?.username}`,
    description: "",
    invites: [],
    link: "",
    dateTime: new Date(),
  });

  const [timeString, setTimeString] = useState(
    values.dateTime.toTimeString().slice(0, 5)
  );

  const [open, setOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(values.dateTime);

  const createMeeting = async (meetingType: string) => {
    if (!client || !user) return;

    try {
      if (meetingType === "isScheduledMeeting" && values.invites.length === 0) {
        toast.error("Error", {
          description: "At least one invite email is required! 🤪",
          id: "create-meeting",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = values.invites.filter((e) => !emailRegex.test(e));
      if (invalid.length > 0) {
        toast.error("Invalid email(s)", {
          description: invalid.join(", "),
          id: "create-meeting",
        });
        return;
      }

      const id = crypto.randomUUID();
      const startAt = values.dateTime.toISOString();
      const topic = `${values.topic} TeleMed Meeting`;
      const description = values.description || "Instant meeting";

      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create call! 😱");

      const res = await call.getOrCreate({
        data: {
          starts_at: startAt,
          custom: { topic, description, invite: values.invites },
        },
      });

      if (res.created && meetingType === "isScheduledMeeting") {
        sendInviteEmail({
          to: values.invites,
          topic: res.call.custom.topic,
          description: res.call.custom.description,
          link: `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`,
          starts_at: new Date(`${res.call.starts_at}`),
        });
      }

      if (meetingType === "isInstantMeeting") {
        router.push(`/meeting/${call.id}`);
      }

      setMeeting(undefined);
      toast.success("Success", {
        description: "Meeting created successfully. 🎉",
        id: "create-meeting",
      });
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "Failed to create meeting! 😱",
        id: "create-meeting",
      });
    }
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

      <MeetingModal
        isOpen={meeting === "isScheduledMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Create Meeting"
        description="Plan your meeting details before starting."
        handleClick={async () => {
          await createMeeting("isScheduledMeeting");
        }}
      >
        <form className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder={`${values.topic} TeleMed Meeting`}
              onChange={(e) =>
                setValues({
                  ...values,
                  topic: e.target.value || values.topic,
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="description"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>

          <InviteInput
            emails={values.invites}
            setEmails={(newEmails) =>
              setValues({ ...values, invites: newEmails })
            }
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
                      setValues({ ...values, dateTime: newDate });
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
                step="1800"
                value={timeString}
                onChange={(e) => {
                  setTimeString(e.target.value);
                  const [hours, minutes] = e.target.value
                    .split(":")
                    .map(Number);
                  const newDate = new Date(values.dateTime);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  setValues({ ...values, dateTime: newDate });
                }}
              />
            </div>
          </div>
        </form>
      </MeetingModal>

      <MeetingModal
        isOpen={meeting === "isInstantMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Start an Instant Meeting"
        description="Start your instant meeting now."
        buttonLabel="Start Meeting"
        handleClick={async () => {
          await createMeeting("isInstantMeeting");
        }}
      />

      <MeetingModal
        isOpen={meeting === "isJoiningMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Type the link here"
        description="Access your personal room using the link below."
        buttonLabel="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
        />
      </MeetingModal>
    </section>
  );
}

function InviteInput({
  emails,
  setEmails,
}: {
  emails: string[];
  setEmails: (emails: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const addEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) return;
    if (!emails.includes(trimmed)) setEmails([...emails, trimmed]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
    inputRef.current?.focus();
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

  const handleBlur = () => {
    if (inputValue) addEmail(inputValue);
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
            onClick={(e) => {
              e.stopPropagation();
              removeEmail(email);
            }}
          >
            {email}
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
        ))}

        <Input
          id="invite"
          ref={inputRef}
          className="border-0 shadow-none focus-visible:ring-0 p-2"
          placeholder="example@gmail.com"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>

      <p className="text-muted-foreground text-[14px]">
        Add multiple emails (press Enter, Tab, or comma). Click email to remove.
      </p>
    </div>
  );
}
