import CallList from "./_components/call-list";

export default function Page() {
  return (
    <section className="flex size-full flex-col gap-10 p-10">
      <h1 className="text-3xl font-bold">Upcoming</h1>

      <CallList type="upcoming" />
    </section>
  );
}
