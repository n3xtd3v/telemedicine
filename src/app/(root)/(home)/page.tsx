import MeetingTypeList from "./_components/meeting-type-list";
import CallList from "./upcoming/_components/call-list";
import Clock from "./_components/clock";
import Upcoming from "./_components/upcoming";

export default function Page() {
  return (
    <section className="flex flex-col size-full p-10 ">
      <div className="text-center">
        <Clock />
      </div>

      <MeetingTypeList />

      <div className="flex flex-col gap-5 size-full p-2">
        <h1 className="text-3xl font-bold text-center p-10">
          <Upcoming />
        </h1>

        <CallList type="upcoming" />
      </div>
    </section>
  );
}
