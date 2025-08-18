"use client";

import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useGetCallById } from "@/hooks/useGetCallById";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Video } from "lucide-react";

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();

  const meetingId = user?.id;

  const { call } = useGetCallById(meetingId!);

  const startRoom = async () => {
    if (!client || !user) return;

    const newCall = client.call("default", meetingId!);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }

    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  return (
    <section className="flex justify-center items-center min-h-dvh">
      <Card className="max-w-[1000px]">
        <CardHeader>
          <CardTitle>Personal Meeting Room</CardTitle>
          <CardDescription>
            A private room that&apos;s always available for you to host
            meetings.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
            <Table
              title="Topic"
              description={`${user?.username}'s Meeting Room`}
            />
            <Table title="Meeting ID" description={meetingId!} />
            <Table title="Invite Link" description={meetingLink} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button onClick={startRoom}>
            <Video />
            Start Meeting
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(meetingLink);
              toast.success("Link Copied");
            }}
          >
            <Copy />
            Copy Invitation
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};

export default PersonalRoom;
