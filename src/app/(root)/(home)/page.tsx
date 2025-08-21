import MeetingTypeList from "./_components/meeting-type-list";
import CallList from "./upcoming/_components/call-list";
import Clock from "./_components/clock";

export default function Page() {
  return (
    <section className="flex flex-col size-full p-10 gap-10">
      <div className="text-center">
        <Clock />
      </div>

      <MeetingTypeList />

      <h1 className=" text-3xl font-bold">Upcoming</h1>
      <CallList type="upcoming" />
    </section>
  );
}
