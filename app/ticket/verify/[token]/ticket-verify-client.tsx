"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  User,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Globe,
  Tag,
  Loader2,
} from "lucide-react";

interface VerificationData {
  valid: boolean;
  event: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    location?: string;
    onlineUrl?: string;
    type: string;
    category: string;
    image?: string;
    communityName?: string;
    creatorName?: string;
  };
  attendee: {
    name: string;
    email: string;
    ticketType: string;
    registeredAt: string;
    checkedIn: boolean;
    checkedInAt?: string;
  };
  ticketInfo?: {
    name: string;
    type: string;
    description: string;
  };
  issuedAt: string;
  verifiedAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
    : "http://localhost:3000/api");

export function TicketVerifyClient({ token }: { token: string }) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/events/ticket/verify/${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setError(json?.message || "Invalid or expired ticket");
          return;
        }
        setData(json.data);
      } catch {
        setError("Unable to verify ticket. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0ecff] via-white to-[#e8e4ff] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#8e78fb] mx-auto" />
          <p className="text-sm text-[#46426a]">Verifying ticket…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff0f0] via-white to-[#ffe8e8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#1a1730]">
            Verification Failed
          </h1>
          <p className="text-sm text-[#46426a]">
            {error || "This ticket could not be verified."}
          </p>
          <p className="text-xs text-[#9590b8]">
            The QR code may be expired, invalid, or tampered with.
          </p>
          <div className="pt-4 border-t border-[#e8e4ff]">
            <ChabaqaWatermark />
          </div>
        </div>
      </div>
    );
  }

  const ev = data.event;
  const att = data.attendee;
  const eventDate = new Date(ev.startDate);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const typeColor =
    ev.type === "Online"
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : ev.type === "Hybrid"
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0ecff] via-[#f7f7fe] to-[#e8e4ff] p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Verification Status Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              ✓ Verified Authentic Ticket
            </p>
            <p className="text-xs text-emerald-600">
              Verified at{" "}
              {new Date(data.verifiedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Main Ticket Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(142,120,251,0.12)] overflow-hidden">
          {/* Event Image / Purple Header */}
          {ev.image ? (
            <div className="relative h-48 overflow-hidden">
              <img
                src={ev.image}
                alt={ev.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-xl font-bold text-white leading-tight">
                  {ev.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#8e78fb] to-[#6c52f0] p-6">
              <p className="text-xs text-white/70 uppercase tracking-widest mb-1">
                Event
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {ev.title}
              </h1>
            </div>
          )}

          {/* Event Details */}
          <div className="p-5 space-y-4">
            {/* Type & Category Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${typeColor}`}
              >
                {ev.type === "Online" ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                {ev.type}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#f0ecff] text-[#6c52f0] border border-[#e8e4ff]">
                <Tag className="h-3 w-3" />
                {ev.category}
              </span>
            </div>

            {/* Date, Time, Location */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-[#8e78fb] flex-shrink-0" />
                <span className="text-[#1a1730] font-medium">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-[#8e78fb] flex-shrink-0" />
                <span className="text-[#1a1730]">
                  {ev.startTime} – {ev.endTime}{" "}
                  <span className="text-[#9590b8]">({ev.timezone})</span>
                </span>
              </div>
              {ev.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-[#8e78fb] flex-shrink-0" />
                  <span className="text-[#1a1730]">{ev.location}</span>
                </div>
              )}
              {ev.communityName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[#8e78fb] flex-shrink-0" />
                  <span className="text-[#46426a]">
                    Hosted by{" "}
                    <span className="font-medium text-[#1a1730]">
                      {ev.creatorName || ev.communityName}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Dashed Divider — like a real ticket tear line */}
            <div className="relative py-2">
              <div className="border-t-2 border-dashed border-[#e8e4ff]" />
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gradient-to-br from-[#f0ecff] to-[#e8e4ff]" />
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gradient-to-br from-[#f0ecff] to-[#e8e4ff]" />
            </div>

            {/* Attendee Info */}
            <div className="bg-[#f8f7ff] rounded-xl p-4 space-y-3">
              <p className="text-xs text-[#9590b8] uppercase tracking-wider font-medium">
                Attendee
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#6c52f0] flex items-center justify-center text-white font-bold text-sm">
                  {att.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1730]">
                    {att.name}
                  </p>
                  <p className="text-xs text-[#9590b8]">{att.email}</p>
                </div>
              </div>
            </div>

            {/* Ticket Info */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#8e78fb]/5 to-[#6c52f0]/5 rounded-xl p-4 border border-[#e8e4ff]">
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-[#8e78fb]" />
                <div>
                  <p className="text-sm font-semibold text-[#1a1730]">
                    {data.ticketInfo?.name || att.ticketType}
                  </p>
                  <p className="text-xs text-[#9590b8]">
                    Registered{" "}
                    {new Date(att.registeredAt).toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
              </div>
              {att.checkedIn && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Checked In
                </div>
              )}
            </div>
          </div>

          {/* Chabaqa Watermark Footer */}
          <div className="border-t border-[#f1eeff] bg-[#faf9ff] px-5 py-4">
            <ChabaqaWatermark />
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-[10px] text-[#9590b8]">
          This is a cryptographically signed digital ticket issued by
          Chabaqa.io
        </p>
      </div>
    </div>
  );
}

function ChabaqaWatermark() {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        width="20"
        height="20"
        viewBox="0 0 40 40"
        fill="none"
        className="flex-shrink-0"
      >
        <rect width="40" height="40" rx="8" fill="#8e78fb" fillOpacity="0.1" />
        <path
          d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 21.6c-5.3 0-9.6-4.3-9.6-9.6S14.7 10.4 20 10.4 29.6 14.7 29.6 20 25.3 29.6 20 29.6z"
          fill="#8e78fb"
        />
        <path
          d="M22.4 15.2l-4.8 4.8 4.8 4.8"
          stroke="#8e78fb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="text-xs font-semibold text-[#8e78fb]">Chabaqa</p>
        <p className="text-[10px] text-[#9590b8]">
          Verified Digital Ticket
        </p>
      </div>
    </div>
  );
}
