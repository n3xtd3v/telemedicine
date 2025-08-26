"use client";

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
import { Copy, Download } from "lucide-react";

interface MeetingCardProps {
  topic: string;
  date: string;
  buttonText?: string;
  link: string;
  isPreviousMeeting?: boolean;
  icon: React.ReactNode;
  buttonIcon1?: React.ReactNode;
  handleClick: () => void;
  description?: string;
  callDescription?: string;
  invites: [];
  checkList: [];
}

const MeetingCard = ({
  icon,
  topic,
  date,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  description,
  callDescription,
  invites,
  checkList,
}: MeetingCardProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(link);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${topic || "recording"}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download recording");
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {icon}
          <p>
            {new Intl.DateTimeFormat("en-US", {
              timeStyle: "short",
              dateStyle: "full",
            }).format(new Date(date))}
          </p>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1 break-words">
        <p className="font-medium">{topic}</p>
        <p className="text-muted-foreground">{callDescription}</p>
        <p className="text-muted-foreground">{invites?.join(", ")}</p>
        <p className="text-muted-foreground">{checkList?.join(", ")}</p>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button onClick={handleClick}>
          {buttonIcon1} {buttonText}
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast.success("Link Copied");
          }}
        >
          <Copy /> Copy Link
        </Button>
        {buttonText === "Play" && (
          <Button onClick={handleDownload}>
            <Download /> Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MeetingCard;
