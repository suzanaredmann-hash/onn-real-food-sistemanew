"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { updateEventStatus, deleteEvent } from "@/app/eventos/actions";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  name: string;
  venue: string | null;
  eventDate: string;
  status: "PLANNED" | "OPEN" | "CLOSED";
};

const STATUS_LABEL: Record<Event["status"], string> = {
  PLANNED: "Planejado",
  OPEN: "Em andamento",
  CLOSED: "Encerrado",
};

const STATUS_BADGE: Record<Event["status"], string> = {
  PLANNED: "bg-onn-support/30 text-[#1c2b57]",
  OPEN: "bg-[#E1F34C]/40 text-[#4b5400]",
  CLOSED: "bg-zinc-100 text-zinc-500",
};

export function EventList({ events: initialEvents }: { events: Event[] }) {
  const [events, setEvents] = useState(initialEvents);

  async function handleStatusChange(id: string, status: Event["status"]) {
    setEvents((current) => current.map((e) => (e.id === id ? { ...e, status } : e)));
    await updateEventStatus(id, status);
  }

  async function handleDelete(id: string) {
    setEvents((current) => current.filter((e) => e.id !== id));
    await deleteEvent(id);
  }

  if (events.length === 0) {
    return <p className="text-sm text-zinc-400">Nenhum evento cadastrado ainda.</p>;
  }

  return (
    <div className="onn-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-zinc-400">
          <tr>
            <th className="px-5 py-3 font-medium">Evento</th>
            <th className="px-5 py-3 font-medium">Data</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-zinc-100">
              <td className="px-5 py-3.5 font-medium text-[#14162e]">
                {event.name}
                {event.venue && (
                  <div className="text-xs font-normal text-zinc-400">{event.venue}</div>
                )}
              </td>
              <td className="px-5 py-3.5 text-zinc-600">
                {new Date(event.eventDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </td>
              <td className="px-5 py-3.5">
                <select
                  value={event.status}
                  onChange={(e) =>
                    handleStatusChange(event.id, e.target.value as Event["status"])
                  }
                  className={cn(
                    "rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none",
                    STATUS_BADGE[event.status]
                  )}
                >
                  {(Object.keys(STATUS_LABEL) as Event["status"][]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-zinc-300 hover:text-red-600"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
