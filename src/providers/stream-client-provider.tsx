"use client";

import { useUser } from "@clerk/nextjs";
import {
  StreamVideo,
  StreamVideoClient,
  User,
} from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import { tokenProvider } from "@/actions/stream";
import Loader from "@/components/loader";
import { v4 as uuidv4 } from "uuid";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!apiKey) throw new Error("Stream API key is missing");
    if (!isLoaded) return;

    let streamUser: User;
    let userId: string;

    if (user) {
      userId = user.id;
      streamUser = {
        id: user.id,
        name: user.username || user.id,
        image: user.imageUrl,
      };
    } else {
      const guestId = localStorage.getItem("guestId") || uuidv4();
      if (!localStorage.getItem("guestId")) {
        localStorage.setItem("guestId", guestId);
      }
      userId = guestId;
      streamUser = {
        id: guestId,
        name: `Guest ${guestId.substring(0, 8)}`,
        type: "guest",
      };
    }

    const client = new StreamVideoClient({
      apiKey,
      user: streamUser,
      tokenProvider: () => tokenProvider(userId),
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
      setVideoClient(undefined);
    };
  }, [user, isLoaded]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
