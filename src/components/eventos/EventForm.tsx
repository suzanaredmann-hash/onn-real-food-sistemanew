"use client";

import { useState, type FormEvent } from "react";
import { createEvent } from "@/app/eventos/actions";

export function EventForm() {
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createEvent({ name, venue, eventDate });
      setName("");
      setVenue("");
      setEventDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input
        placeholder="Nome do evento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input flex-1"
        required
      />
      <input
        placeholder="Local"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        className="input flex-1"
      />
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="input"
        required
      />
      <button type="submit" disabled={isSubmitting} className="onn-btn-primary">
        {isSubmitting ? "Salvando..." : "Criar evento"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
