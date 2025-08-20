"use client";

import { Badge } from "@/components/ui/badge";
import { UseNextUpcomingCall } from "@/hooks/use-upcoming-calls";
import { useEffect, useState } from "react";

export default function Upcoming() {
  const { data: nextUpcoming, isLoading } = UseNextUpcomingCall();
  const [, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;
  if (!nextUpcoming) return null;

  const startTime = new Date(nextUpcoming.state.startsAt!);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(startTime)
    .replace(",", " at");

  return (
    <Badge variant="outline" className="mt-5">
      <p className="text-lg font-medium p-1">
        Upcoming Meeting at: {formattedDate}
      </p>
    </Badge>
  );
}
