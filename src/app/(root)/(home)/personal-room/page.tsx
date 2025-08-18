"use client";

import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient, StreamCall } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import Loader from "@/components/loader";

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
      <h1 className="text-sm font-bold max-sm:max-w-[320px] lg:text-xl break-words">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoomContent = ({
  meetingId,
  meetingLink,
}: {
  meetingId: string;
  meetingLink: string;
}) => {
  const router = useRouter();

  return (
    <Card className="max-w-[1000px]">
      <CardHeader>
        <CardTitle>Personal Meeting Room</CardTitle>
        <CardDescription>
          A private room that&apos;s always available for you to host meetings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex w-full flex-col gap-8 xl:max-w-[1400px]">
          <Table title="Topic" description="Personal Meeting Room" />
          <Table title="Meeting ID" description={meetingId} />
          <Table title="Invite Link" description={meetingLink} />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          onClick={() => router.push(`/meeting/${meetingId}?personal=true`)}
        >
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
  );
};

const PersonalRoom = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [call, setCall] = useState<any>(null);

  const meetingId = user?.id;
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  useEffect(() => {
    if (!client || !meetingId) return;

    const init = async () => {
      const newCall = client.call("default", meetingId);

      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });

      setCall(newCall);
    };

    init();
  }, [client, meetingId]);

  if (!call) return <Loader />;

  return (
    <section className="flex justify-center items-center min-h-dvh">
      <StreamCall call={call}>
        <PersonalRoomContent meetingId={meetingId!} meetingLink={meetingLink} />
      </StreamCall>
    </section>
  );
};

export default PersonalRoom;
