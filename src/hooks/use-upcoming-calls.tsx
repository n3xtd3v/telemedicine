import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Call } from "@stream-io/video-react-sdk";

export const UseUpcomingCalls = ({ enabled = true } = {}) => {
  const client = useStreamVideoClient();
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ["calls", "upcoming", user?.id],
    queryFn: async (): Promise<Call[]> => {
      if (!client || !user?.id) return [];

      const { calls } = await client.queryCalls({
        sort: [{ field: "starts_at", direction: 1 }],
        filter_conditions: {
          starts_at: { $gte: new Date().toISOString() },
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
      });

      const now = new Date();
      return calls
        .filter(
          ({ state: { startsAt } }) => startsAt && new Date(startsAt) > now
        )
        .sort(
          (a, b) =>
            new Date(a.state.startsAt!).getTime() -
            new Date(b.state.startsAt!).getTime()
        );
    },
    enabled: enabled && isLoaded && !!user?.id && !!client,
    refetchInterval: 30000,
  });
};

export const UseNextUpcomingCall = ({ enabled = true } = {}) => {
  const { data: upcomingCalls = [], ...rest } = UseUpcomingCalls({ enabled });

  return {
    data: upcomingCalls.length > 0 ? upcomingCalls[0] : null,
    ...rest,
  };
};
