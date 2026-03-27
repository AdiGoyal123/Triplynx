"use client";

import { FormEvent, useState } from "react";
import { UserMinus } from "lucide-react";

export type LocalParticipant = {
  id: string;
  name: string;
  email: string;
};

export function TripParticipantsPanel() {
  const [participants, setParticipants] = useState<LocalParticipant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    setParticipants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
      },
    ]);
    setName("");
    setEmail("");
  };

  const remove = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-background p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Participants</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add people to this trip. Changes stay in this browser session only until you connect a
        backend.
      </p>

      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={onSubmit}
      >
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Name</span>
          <input
            className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Kim"
            autoComplete="name"
          />
        </label>

        <label className="grid gap-1 sm:col-span-2 sm:max-w-md">
          <span className="text-sm font-medium">Email (optional)</span>
          <input
            type="email"
            className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            autoComplete="email"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Add participant
          </button>
        </div>
      </form>

      {participants.length > 0 ? (
        <ul className="mt-8 divide-y divide-border/60 border-t border-border/60 pt-6">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{p.name}</p>
                {p.email ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.email}</p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">No email</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Remove ${p.name}`}
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No participants yet. Add someone using the form above.
        </p>
      )}
    </section>
  );
}
