import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type EventItem = {
  id: string;
  title: string;
  date: string; // "2025-11-20"
  time: string; // "18:00"
  location: string;
  cover: string;
  description: string;
  organizerId?: string;
};

type State = {
  events: EventItem[];
  registeredIds: string[]; // student
  createdIds: string[];    // organizer-created
};

const demo: EventItem[] = [
  { id: "e1", title: "UofT Hack Night", date: "2025-11-18", time: "18:30", location: "Bahen 1130", cover: "https://picsum.photos/seed/1/600/400", description: "Weekly coding hangout." },
  { id: "e2", title: "Career Fair",     date: "2025-11-20", time: "10:00", location: "Varsity Arena", cover: "https://picsum.photos/seed/2/600/400", description: "Meet recruiters across industries." },
];

const slice = createSlice({
  name: "events",
  initialState: { events: demo, registeredIds: [], createdIds: [] } as State,
  reducers: {
    registerForEvent: (s, a: PayloadAction<string>) => {
      if (!s.registeredIds.includes(a.payload)) s.registeredIds.push(a.payload);
    },
    createEvent: (s, a: PayloadAction<Omit<EventItem, "id">>) => {
      const id = nanoid();
      s.events.unshift({ id, ...a.payload });
      s.createdIds.unshift(id);
    },
  },
});

export const { registerForEvent, createEvent } = slice.actions;
export default slice.reducer;

export const selectEvents = (s: RootState) => s.events.events;
export const selectEventById = (s: RootState, id?: string) => s.events.events.find(e => e.id === id);
export const selectRegisteredEvents = (s: RootState) => s.events.registeredIds.map(id => s.events.events.find(e=>e?.id===id)!).filter(Boolean);
export const selectOrganizerEvents = (s: RootState) => s.events.createdIds.map(id => s.events.events.find(e=>e?.id===id)!).filter(Boolean);
