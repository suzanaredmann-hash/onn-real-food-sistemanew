import { db } from "@/lib/db";
import { CalendarDays } from "lucide-react";
import { EventForm } from "@/components/eventos/EventForm";
import { EventList } from "@/components/eventos/EventList";

export default async function EventosPage() {
  const events = await db.event.findMany({
    orderBy: { eventDate: "asc" },
  });

  const plainEvents = events.map((e) => ({
    id: e.id,
    name: e.name,
    venue: e.venue,
    eventDate: e.eventDate.toISOString(),
    status: e.status,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex items-center gap-4 p-6 sm:p-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-onn-primary">
          <CalendarDays size={22} />
        </span>
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Eventos</h1>
          <p className="mt-1 text-sm text-[#14162e]/70">
            Onde e quando a ONN vai operar.
          </p>
        </div>
      </div>

      <div className="onn-card mb-6 p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-[#14162e]">Novo evento</h2>
        <EventForm />
      </div>

      <EventList events={plainEvents} />
    </div>
  );
}
