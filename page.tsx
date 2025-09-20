// app/page.tsx
"use client";
import React, { useMemo, useState } from "react";

type BlockStatus = "open" | "closed" | "cancelled";
type BookingStatus = "pending" | "approved" | "cancelled";

type Block = {
  id: string;
  title: string;
  location: string;
  startsAt: string; // yyyy-MM-ddTHH:mm
  endsAt: string;   // yyyy-MM-ddTHH:mm
  capacity: number;
  status: BlockStatus;
  notes?: string;
};

type Booking = {
  id: string;
  blockId: string;
  employeeName: string;
  employeeEmail: string;
  status: BookingStatus;
  bookedAt: string; // ISO
};

export default function Home() {
  const [role, setRole] = useState<"admin" | "staff">("admin");
  const [blocks, setBlocks] = useState<Block[]>([
    mkBlock("Früh – Objekt A", "07:15", "11:15", "Eingang & Flur"),
    mkBlock("Spät – Objekt B", "14:55", "18:55"),
    mkBlock("Abend – Objekt C", "19:00", "21:00"),
  ]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    capacity: 1,
    notes: "",
  });

  const bookingsByBlock = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!m[b.blockId]) m[b.blockId] = [];
      m[b.blockId].push(b);
    });
    return m;
  }, [bookings]);

  function addBlock() {
    if (!form.title || !form.startsAt || !form.endsAt) return;
    const newBlock: Block = {
      id: rid("b"),
      title: form.title,
      location: "Duisburg",
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      capacity: Math.max(1, Number(form.capacity || 1)),
      status: "open",
      notes: form.notes || undefined,
    };
    setBlocks((p) => [newBlock, ...p]);
    setForm({ title: "", startsAt: "", endsAt: "", capacity: 1, notes: "" });
  }

  function requestBooking(block: Block) {
    const name = prompt("Dein Name (Demo)", "Mitarbeiter Mustermann");
    if (!name) return;
    const email = prompt("Deine E-Mail (Demo)", "mitarbeiter@example.com");
    if (!email) return;

    const already = bookings.find(
      (bk) => bk.blockId === block.id && bk.employeeEmail === email && bk.status !== "cancelled"
    );
    if (already) {
      alert("Du hast für diesen Block bereits eine Buchung.");
      return;
    }

    const newBooking: Booking = {
      id: rid("bk"),
      blockId: block.id,
      employeeName: name,
      employeeEmail: email,
      status: "pending",
      bookedAt: new Date().toISOString(),
    };
    setBookings((p) => [newBooking, ...p]);
    alert("Buchungsanfrage gesendet. Warte auf Admin-Freigabe.");
  }

  function approveBooking(booking: Booking) {
    setBookings((p) => p.map((b) => (b.id === booking.id ? { ...b, status: "approved" } : b)));
  }
  function cancelBooking(booking: Booking) {
    setBookings((p) => p.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)));
  }
  function closeBlock(block: Block) {
    setBlocks((p) => p.map((bl) => (bl.id === block.id ? { ...bl, status: "closed" } : bl)));
  }
  function reopenBlock(block: Block) {
    setBlocks((p) => p.map((bl) => (bl.id === block.id ? { ...bl, status: "open" } : bl)));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white grid place-items-center text-xs font-bold">OS</div>
            <div>
              <h1 className="text-xl font-semibold">Ohay Solutions Tool™</h1>
              <p className="text-xs text-gray-500">Duisburg · Pilot · Admin-Freigabe</p>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl p-1 flex">
            {(["admin","staff"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setRole(k)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  role === k ? "bg-white shadow" : "text-gray-600 hover:text-black"
                }`}
              >
                {k === "admin" ? "Admin" : "Mitarbeiter"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {role === "admin" ? (
          <AdminView
            blocks={blocks}
            bookingsByBlock={bookingsByBlock}
            form={form}
            setForm={setForm}
            addBlock={addBlock}
            approveBooking={approveBooking}
            cancelBooking={cancelBooking}
            closeBlock={closeBlock}
            reopenBlock={reopenBlock}
          />
        ) : (
          <StaffView blocks={blocks} bookingsByBlock={bookingsByBlock} onBook={requestBooking} />
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">© {new Date().getFullYear()} Ohay Solutions</footer>
    </div>
  );
}

function AdminView({
  blocks,
  bookingsByBlock,
  form,
  setForm,
  addBlock,
  approveBooking,
  cancelBooking,
  closeBlock,
  reopenBlock,
}: {
  blocks: Block[];
  bookingsByBlock: Record<string, Booking[]>;
  form: any;
  setForm: (f: any) => void;
  addBlock: () => void;
  approveBooking: (b: Booking) => void;
  cancelBooking: (b: Booking) => void;
  closeBlock: (b: Block) => void;
  reopenBlock: (b: Block) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Block anlegen</h2>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Titel">
              <input
                className="w-full mt-1 rounded-xl border px-3 py-2"
                placeholder="z. B. Früh – Objekt X"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Kapazität">
              <input
                type="number"
                min={1}
                className="w-full mt-1 rounded-xl border px-3 py-2"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value || 1) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Start">
              <input
                type="datetime-local"
                className="w-full mt-1 rounded-xl border px-3 py-2"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
            <Field label="Ende">
              <input
                type="datetime-local"
                className="w-full mt-1 rounded-xl border px-3 py-2"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notiz">
            <input
              className="w-full mt-1 rounded-xl border px-3 py-2"
              placeholder="z. B. Eingang & Flur"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button onClick={addBlock} className="px-4 py-2 rounded-xl bg-black text-white">Block speichern</button>
            <p className="text-xs text-gray-500">Standort: Duisburg · Status: offen</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Blöcke & Buchungen</h2>
        <div className="space-y-3">
          {blocks.map((b) => (
            <div key={b.id} className="border rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{b.title}</h3>
                    <Badge>{b.status === "open" ? "offen" : b.status === "closed" ? "geschlossen" : "storniert"}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{fmtRange(b.startsAt, b.endsAt)} · Kapazität {b.capacity}</p>
                  {b.notes && <p className="text-sm text-gray-500">{b.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {b.status === "open" ? (
                    <button onClick={() => closeBlock(b)} className="px-3 py-1 rounded-lg border">Schließen</button>
                  ) : (
                    <button onClick={() => reopenBlock(b)} className="px-3 py-1 rounded-lg border">Wieder öffnen</button>
                  )}
                </div>
              </div>

              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Buchungen</p>
                <div className="space-y-2">
                  {(bookingsByBlock[b.id] || []).length === 0 && (
                    <p className="text-sm text-gray-500">Keine Buchungen.</p>
                  )}
                  {(bookingsByBlock[b.id] || []).map((bk) => (
                    <div key={bk.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm"><span className="font-medium">{bk.employeeName}</span> · {bk.employeeEmail}</p>
                        <p className="text-xs text-gray-500">{fmtDateTime(bk.bookedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>
                          {bk.status === "pending" ? "wartet auf Freigabe" : bk.status === "approved" ? "bestätigt" : "storniert"}
                        </Badge>
                        {bk.status === "pending" && (
                          <>
                            <button onClick={() => approveBooking(bk)} className="px-3 py-1 rounded-lg bg-black text-white">Freigeben</button>
                            <button onClick={() => cancelBooking(bk)} className="px-3 py-1 rounded-lg border">Ablehnen</button>
                          </>
                        )}
                        {bk.status === "approved" && (
                          <button onClick={() => cancelBooking(bk)} className="px-3 py-1 rounded-lg border">Stornieren</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StaffView({
  blocks,
  bookingsByBlock,
  onBook,
}: {
  blocks: Block[];
  bookingsByBlock: Record<string, Booking[]>;
  onBook: (b: Block) => void;
}) {
  const openBlocks = blocks.filter((b) => b.status === "open");
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Offene Blöcke (Duisburg)</h2>
      <div className="space-y-3">
        {openBlocks.length === 0 && <p className="text-sm text-gray-500">Keine offenen Blöcke.</p>}
        {openBlocks.map((b) => {
          const approved = (bookingsByBlock[b.id] || []).filter((x) => x.status === "approved");
          const pending = (bookingsByBlock[b.id] || []).filter((x) => x.status === "pending");
          const full = approved.length >= b.capacity;
          return (
            <div key={b.id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{b.title}</h3>
                  <p className="text-sm text-gray-600">{fmtRange(b.startsAt, b.endsAt)}</p>
                  <p className="text-xs text-gray-500">Kapazität {approved.length}/{b.capacity} · {pending.length} ausstehend</p>
                </div>
                <div>
                  <button
                    disabled={full}
                    onClick={() => onBook(b)}
                    className={`px-4 py-2 rounded-xl ${full ? "bg-gray-200 text-gray-500" : "bg-black text-white"}`}
                  >
                    {full ? "Belegt" : "Jetzt buchen"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{children}</span>;
}

function fmtRange(a: string, b: string) {
  return `${fmtDateTime(a)} – ${fmtDateTime(b)}`;
}
function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
function rid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 8);
}
function isoTodayWithTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // to yyyy-MM-ddTHH:mm (local)
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  const ho = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${mo}-${da}T${ho}:${mi}`;
}
function mkBlock(title: string, startHHmm: string, endHHmm: string, notes?: string): Block {
  return {
    id: rid("b"),
    title,
    location: "Duisburg",
    startsAt: isoTodayWithTime(startHHmm),
    endsAt: isoTodayWithTime(endHHmm),
    capacity: 1,
    status: "open",
    notes,
  };
}
