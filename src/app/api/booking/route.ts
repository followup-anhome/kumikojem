export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────
interface BookingRequest {
  job_title: string;
  company_name: string;
  date: string;          // "2026-03-12"
  time_slot: string;     // "10:00"
  interview_type: "online" | "in-person";
  talent_id?: string;
  talent_name?: string;
}

interface BookingResponse {
  booking_id: string;
  status: "confirmed";
  job_title: string;
  company_name: string;
  date: string;
  time_slot: string;
  interview_type: string;
  meet_link?: string;
  address?: string;
  confirmed_at: string;
  calendar_added: boolean;
  message: string;
}

// ── In-memory store (demo) ───────────────────────────────
const bookings: BookingResponse[] = [];

// ── Helpers ──────────────────────────────────────────────
function generateBookingId(): string {
  return "BK" + Date.now().toString(36).toUpperCase();
}

function generateMeetLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function formatConfirmationMessage(booking: BookingResponse): string {
  const date = new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const type = booking.interview_type === "online"
    ? `Online interview via Google Meet: ${booking.meet_link}`
    : `In-person interview at: ${booking.address}`;

  return (
    `Interview confirmed!\n` +
    `📋 ${booking.job_title} at ${booking.company_name}\n` +
    `📅 ${date} at ${booking.time_slot}\n` +
    `${type}\n` +
    `Booking ID: ${booking.booking_id}`
  );
}

// ── Route handlers ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();

    // Validate required fields
    if (!body.date || !body.time_slot || !body.interview_type) {
      return NextResponse.json(
        { error: "date, time_slot, and interview_type are required" },
        { status: 400 }
      );
    }

    // Date validation — must be a future weekday
    const bookingDate = new Date(body.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate <= today) {
      return NextResponse.json(
        { error: "Booking date must be in the future" },
        { status: 400 }
      );
    }

    const dayOfWeek = bookingDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: "Interviews are only scheduled on weekdays (Mon–Fri)" },
        { status: 400 }
      );
    }

    // Build booking record
    const booking: BookingResponse = {
      booking_id: generateBookingId(),
      status: "confirmed",
      job_title: body.job_title ?? "Job Position",
      company_name: body.company_name ?? "Company",
      date: body.date,
      time_slot: body.time_slot,
      interview_type: body.interview_type,
      confirmed_at: new Date().toISOString(),
      calendar_added: true, // Mock — would call Google Calendar API in production
      message: "",
    };

    if (body.interview_type === "online") {
      booking.meet_link = generateMeetLink();
    } else {
      booking.address = "Osaka Umeda Office, 2-1-3 Umeda, Kita-ku, Osaka (Map sent separately)";
    }

    booking.message = formatConfirmationMessage(booking);

    // Store (in-memory, demo only)
    bookings.push(booking);

    // In production, here you would:
    // 1. Insert to DB: await prisma.interviewBooking.create(...)
    // 2. Create Google Calendar event via googleapis
    // 3. Send confirmation email/push notification

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[/api/booking] Error:", error);
    return NextResponse.json(
      { error: "Booking failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET — list bookings (demo)
export async function GET() {
  return NextResponse.json({
    count: bookings.length,
    bookings,
  });
}
