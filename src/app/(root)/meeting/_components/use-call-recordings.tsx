import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const UseCallRecordings = ({ enabled = true } = {}) => {
  const client = useStreamVideoClient();
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ["calls", "recordings", user?.id],
    queryFn: async () => {
      if (!client || !user?.id) return [];
      const { calls } = await client.queryCalls({
        filter_conditions: {
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
      });

      const recordings = await Promise.all(
        calls.map(async (call) => {
          const rec = await call.queryRecordings();
          return rec.recordings;
        })
      );

      return recordings.flat();
    },
    enabled: enabled && isLoaded && !!user?.id && !!client,
    refetchInterval: 60000,
  });
};
