import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const UseEndedCalls = ({ enabled = true } = {}) => {
  const client = useStreamVideoClient();
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ["calls", "ended", user?.id],
    queryFn: async () => {
      if (!client || !user?.id) return [];
      const now = new Date().toISOString();
      const { calls } = await client.queryCalls({
        sort: [{ field: "starts_at", direction: -1 }],
        filter_conditions: {
          $and: [
            {
              $or: [
                { ended_at: { $exists: true } },
                { starts_at: { $lt: now } },
              ],
            },
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
    enabled: enabled && isLoaded && !!user?.id && !!client,
    refetchInterval: 30000,
  });
};
