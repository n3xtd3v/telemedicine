"use client";

import React, { useState } from "react";
import HomeCard from "./home-card";
import {
  CalendarDays,
  CalendarIcon,
  Loader,
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateMeetingSchema, CreateMeetingSchemaType } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { startOfToday } from "date-fns";

export default function MeetingTypeList() {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const queryClient = useQueryClient();
  const [meeting, setMeeting] = useState<
    "isScheduledMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm<CreateMeetingSchemaType>({
    resolver: zodResolver(CreateMeetingSchema),
    defaultValues: {
      topic: "",
      description: "",
      invites: [],
      dateTime: new Date(),
      link: "",
    },
  });

  const values = form.watch();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(values.dateTime);

  const [timeString, setTimeString] = useState(
    values.dateTime.toTimeString().slice(0, 5)
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (isNaN(hours) || isNaN(minutes)) return;

    const currentDate = new Date(values.dateTime);
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);

    form.setValue("dateTime", currentDate);
    setTimeString(e.target.value);
  };

  const createIntantMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast.error("Error", {
          description: "Please select a date and time! 😱",
          id: "create-intant-meeting",
        });
        return;
      }

      const id = crypto.randomUUID();
      const call = client.call("default", id);

      if (!call) throw new Error("Failed to create meeting! 😱");

      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || "Instant Meeting";

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });

      router.push(`/meeting/${call.id}`);

      toast.success("Success", {
        description: "Meeting Created. 🎉",
        id: "create-intant-meeting",
      });
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "Failed to create meeting! 😱",
        id: "create-intant-meeting",
      });
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (formValues: CreateMeetingSchemaType) => {
      if (!client || !user) throw new Error("No client or user! 😱");

      const id = crypto.randomUUID();
      const startAt = formValues.dateTime.toISOString();
      const topic = `${formValues.topic} TeleMed Meeting`;
      const description = formValues.description;

      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create call! 😱");

      const res = await call.getOrCreate({
        data: {
          starts_at: startAt,
          custom: { topic, description, invites: formValues.invites },
        },
      });

      if (res.created) {
        sendInviteEmail({
          to: formValues.invites,
          topic: res.call.custom.topic,
          description: res.call.custom.description,
          link: `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`,
          starts_at: new Date(`${res.call.starts_at}`),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });

      toast.success("Success", {
        description: "Meeting created successfully. 🎉",
        id: "create-room",
      });

      setMeeting(undefined);

      form.reset();
    },
    onError: (error) => {
      console.log(error);
      toast.error("Error", {
        description: "Failed to create meeting! 😱",
        id: "create-meeting",
      });
    },
  });

  const onSubmit = (values: CreateMeetingSchemaType) => {
    toast.loading("Loading", {
      description: "Creating your meeting room… 😴",
      id: "create-room",
    });

    mutate(values);
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
        isOpen={meeting === "isInstantMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Start an Instant Meeting"
        description="Start your instant meeting now."
        buttonLabel="Start Meeting"
        handleClick={createIntantMeeting}
      />

      <MeetingModal
        isOpen={meeting === "isScheduledMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Create Meeting"
        description="Plan your meeting details before starting."
      >
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="topic"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="topic">Topic</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="topic"
                      name="topic"
                      placeholder={`${
                        user?.fullName || user?.username
                      } TeleMed Meeting`}
                      autoComplete="true"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="description"
                      name="description"
                      placeholder="description"
                      autoComplete="true"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="invites"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="invites">Invites</FormLabel>
                  <FormControl>
                    <InviteInput
                      state={isPending}
                      emails={field.value}
                      setEmails={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-[14px]">
                    Add multiple emails (press Enter, Tab, or comma). Click
                    email to remove.
                  </p>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Date</FormLabel>
                    <Popover
                      open={isPopoverOpen}
                      onOpenChange={setIsPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="pl-3 text-left font-normal"
                          >
                            {formattedDate}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 border-none rounded-none"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsPopoverOpen(false);
                          }}
                          disabled={(date) => date < startOfToday()}
                          className="rounded-md border shadow-sm"
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="time-picker">Time</Label>
                <Input
                  type="time"
                  id="time-picker"
                  step="300"
                  value={timeString}
                  onChange={handleTimeChange}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  disabled={isPending}
                />
              </div>
            </div>

            <Button className="w-full" type="submit">
              {isPending ? (
                <Loader className="animate-spin" />
              ) : (
                "Create Schedule Meeting"
              )}
            </Button>
          </form>
        </Form>
      </MeetingModal>

      <MeetingModal
        isOpen={meeting === "isJoiningMeeting"}
        onClose={() => setMeeting(undefined)}
        title="Type the link here"
        description="Access your personal room using the link below."
        buttonLabel="Join Meeting"
        handleClick={() => router.push(values.link || "")}
      >
        <div className="grid gap-2">
          <Label htmlFor="description">Link</Label>
          <Controller
            name="link"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                id="link"
                name="link"
                placeholder={`${
                  process.env.NEXT_PUBLIC_BASE_URL
                }/meeting/${crypto.randomUUID()}`}
              />
            )}
          />
        </div>
      </MeetingModal>
    </section>
  );
}

function InviteInput({
  emails,
  setEmails,
  state,
}: {
  emails: string[];
  setEmails: (emails: string[]) => void;
  state: boolean;
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
      <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 focus-within:ring-2 focus-within:ring-ring">
        {emails.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => removeEmail(email)}
          >
            {email}
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
        ))}
        <Input
          id="invites"
          name="invites"
          className="border-0 shadow-none focus-visible:ring-0 p-2"
          placeholder="example@gmail.com"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="true"
          disabled={state}
        />
      </div>
    </div>
  );
}
