import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CalBUDI Web App
// Screens: Landing → Dashboard → Create Link → Public Booking Page → NFC Demo
// Design: Deep navy + electric blue, clean modern scheduling UI
// ─────────────────────────────────────────────────────────────────────────────

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  name: "Sarah Chen",
  email: "sarah@company.com",
  avatar: "SC",
  plan: "business",
  timezone: "America/Los_Angeles",
};

const MOCK_LINKS = [
  { id: "1", slug: "sarah-30min", title: "30-Min Intro Call", duration: 30, active: true, bookings: 12, team: ["AE John", "SE Mike"], color: "#2E86DE" },
  { id: "2", slug: "demo-call",   title: "Product Demo",      duration: 60, active: true, bookings: 8,  team: ["AE John"],           color: "#27AE60" },
  { id: "3", slug: "team-sync",   title: "Team Sync",          duration: 45, active: false, bookings: 3, team: ["AE John", "SE Mike", "SDR Alex"], color: "#8E44AD" },
];

const MOCK_UPCOMING = [
  { id: "b1", guest: "James Wilson",   company: "Acme Corp",     time: "Today, 2:00 PM",     tz: "PST", duration: 30, type: "Intro Call",    avatar: "JW", color: "#E74C3C" },
  { id: "b2", guest: "Lisa Park",      company: "TechFlow Inc",  time: "Today, 4:30 PM",     tz: "PST", duration: 60, type: "Product Demo",  avatar: "LP", color: "#3498DB" },
  { id: "b3", guest: "Marcus Johnson", company: "RetailPlus",    time: "Tomorrow, 10:00 AM", tz: "PST", duration: 30, type: "Intro Call",    avatar: "MJ", color: "#27AE60" },
  { id: "b4", guest: "Emma Rodriguez", company: "DataSync",      time: "Tomorrow, 1:00 PM",  tz: "PST", duration: 45, type: "Team Sync",     avatar: "ER", color: "#9B59B6" },
];

// Generate mock available slots (next 14 days)
function generateSlots() {
  const slots = [];
  const now = new Date();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const times = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
                 "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];

  for (let d = 0; d < 14; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d + 1);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dayName = days[date.getDay() - 1];
    const month = date.toLocaleString("en-US", { month: "short" });
    const dayNum = date.getDate();

    // Randomly skip some times to simulate busy calendars
    const available = times.filter(() => Math.random() > 0.35);
    for (const time of available.slice(0, 5)) {
      slots.push({ date: `${dayName}, ${month} ${dayNum}`, time, timestamp: date.getTime() + d });
    }
  }
  return slots;
}

const MOCK_SLOTS = generateSlots();

// Group slots by date
const slotsByDate = MOCK_SLOTS.reduce((acc, slot) => {
  if (!acc[slot.date]) acc[slot.date] = [];
  acc[slot.date].push(slot);
  return acc;
}, {} as Record<string, typeof MOCK_SLOTS>);

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) => {
  const paths: Record<string, string> = {
    calendar: "M8 2v2M16 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    clock: "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
    check: "M20 6L9 17l-5-5",
    copy:  "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-4-4M8 4h8M8 4v4h8V4",
    plus:  "M12 5v14M5 12h14",
    nfc:   "M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zM8 9h8M8 12h8M8 15h5",
    zap:   "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    arrow: "M5 12h14M12 5l7 7-7 7",
    globe: "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2c-2.76 3.45-4 7-4 10s1.24 6.55 4 10M12 2c2.76 3.45 4 7 4 10s-1.24 6.55-4 10",
    bar:   "M18 20V10M12 20V4M6 20v-6",
    x:     "M18 6L6 18M6 6l12 12",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || ""} />
    </svg>
  );
};

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  navy:       "#0D1B2E",
  navyMid:    "#1E3A5F",
  navyLight:  "#2A4A7A",
  blue:       "#2E86DE",
  blueLight:  "#5BA3F5",
  electric:   "#00C6FF",
  white:      "#FFFFFF",
  offWhite:   "#F0F4F8",
  border:     "#1E3A5F",
  borderLight:"#2A4A7A",
  text:       "#E8EEF4",
  textMid:    "#8BA5C4",
  textLight:  "#5A7A9A",
  green:      "#27AE60",
  greenLight: "#2ECC71",
  red:        "#E74C3C",
  amber:      "#F39C12",
  purple:     "#8E44AD",
  cardBg:     "#0F2035",
  inputBg:    "#0A1525",
};

// ── Styles helper ──────────────────────────────────────────────────────────────
const css = (styles: Record<string, any>) => styles;

// ── Components ────────────────────────────────────────────────────────────────

function Avatar({ initials, color = T.blue, size = 36 }: { initials: string; color?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.36,
      fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ label, color = T.blue }: { label: string; color?: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 4, fontSize: 11,
      fontWeight: 600, background: color + "22", color,
      letterSpacing: "0.04em", fontFamily: "'DM Mono', monospace",
    }}>
      {label}
    </span>
  );
}

function Button({ label, onClick, variant = "primary", icon, size = "md", disabled = false }: {
  label: string; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: string; size?: "sm" | "md" | "lg"; disabled?: boolean;
}) {
  const variants = {
    primary:   { bg: T.blue,    color: "#fff", border: "none" },
    secondary: { bg: "transparent", color: T.blue, border: `1.5px solid ${T.blue}` },
    ghost:     { bg: "transparent", color: T.textMid, border: "none" },
    danger:    { bg: T.red,     color: "#fff", border: "none" },
  };
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 13 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 15 },
  };
  const v = variants[variant];
  const s = sizes[size];
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...v, ...s,
        borderRadius: 8,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        fontFamily: "'DM Sans', sans-serif",
        opacity: disabled ? 0.5 : hover ? 0.9 : 1,
        transition: "all 0.15s ease",
        outline: "none",
        transform: hover && !disabled ? "translateY(-1px)" : "none",
        boxShadow: hover && !disabled && variant === "primary" ? "0 4px 16px rgba(46,134,222,0.4)" : "none",
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {label}
    </button>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: any }) {
  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: 24,
      ...style
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color = T.blue }: {
  label: string; value: string; sub?: string; icon: string; color?: string;
}) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: T.textMid, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.textLight }}>{sub}</div>}
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

// LANDING PAGE
function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const headlines = [
    "Three calendars. One link.",
    "Tap phones. Book instantly.",
    "Route by domain. Auto-assign.",
  ];
  const current = tick % headlines.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse 80% 60% at 50% -20%, #1a3a6a 0%, ${T.navy} 60%)`,
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "20px 48px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.white, letterSpacing: "-0.02em" }}>
          Cal<span style={{ color: T.electric }}>BUDI</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Button label="Log In" variant="ghost" onClick={onEnter} />
          <Button label="Get Started" variant="primary" onClick={onEnter} />
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>
          <Badge label="NOW IN BETA — FREE TO TRY" color={T.electric} />
        </div>
        <div style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.03em", minHeight: "1.2em", transition: "all 0.4s ease" }}>
          {headlines[current]}
        </div>
        <div style={{ fontSize: 20, color: T.textMid, maxWidth: 560, marginBottom: 40, lineHeight: 1.6 }}>
          CalBUDI checks every team member's calendar simultaneously. No back-and-forth. No scheduling hell.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Button label="Try the Demo →" size="lg" onClick={onEnter} />
          <Button label="See How It Works" variant="secondary" size="lg" />
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: "users", label: "Multi-calendar links" },
            { icon: "nfc",  label: "NFC tap-to-meet" },
            { icon: "globe", label: "Domain auto-routing" },
            { icon: "zap",  label: "Real-time availability" },
          ].map(f => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              background: T.cardBg, border: `1px solid ${T.border}`,
              borderRadius: 100, fontSize: 13, color: T.textMid,
            }}>
              <Icon name={f.icon} size={14} color={T.blue} />
              {f.label}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 64, display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { val: "< 30s", label: "NFC tap-to-book" },
            { val: "10+",   label: "Calendars checked instantly" },
            { val: "$18",   label: "per user/mo (Business)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.electric }}>{s.val}</div>
              <div style={{ fontSize: 13, color: T.textMid, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// DASHBOARD
function Dashboard({ onCreateLink, onOpenLink, onNfc }: {
  onCreateLink: () => void; onOpenLink: (slug: string) => void; onNfc: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (slug: string) => {
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.navy, display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: T.cardBg, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.white, letterSpacing: "-0.02em" }}>
            Cal<span style={{ color: T.electric }}>BUDI</span>
          </div>
        </div>
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { icon: "bar",      label: "Dashboard",  active: true },
            { icon: "link",     label: "My Links",   active: false },
            { icon: "calendar", label: "Bookings",   active: false },
            { icon: "users",    label: "Team",       active: false },
            { icon: "settings", label: "Settings",   active: false },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginBottom: 2,
              background: item.active ? T.navyLight : "transparent",
              color: item.active ? T.white : T.textMid,
              cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              fontWeight: item.active ? 600 : 400,
            }}>
              <Icon name={item.icon} size={16} color={item.active ? T.blue : T.textMid} />
              {item.label}
            </div>
          ))}
        </div>

        {/* NFC button */}
        <div style={{ padding: "12px 12px 0", borderTop: `1px solid ${T.border}` }}>
          <div
            onClick={onNfc}
            style={{
              background: `linear-gradient(135deg, ${T.electric}22, ${T.blue}33)`,
              border: `1px solid ${T.electric}44`,
              borderRadius: 10, padding: "12px",
              cursor: "pointer", textAlign: "center",
            }}
          >
            <Icon name="nfc" size={20} color={T.electric} />
            <div style={{ fontSize: 12, color: T.electric, fontWeight: 600, marginTop: 4 }}>
              NFC Tap
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "16px 16px 0", marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={MOCK_USER.avatar} color={T.blue} size={32} />
          <div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{MOCK_USER.name}</div>
            <div style={{ fontSize: 11, color: T.textMid }}>{MOCK_USER.plan.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
              Good morning, {MOCK_USER.name.split(" ")[0]} 👋
            </h1>
            <p style={{ margin: "4px 0 0", color: T.textMid, fontSize: 14 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {MOCK_USER.timezone}
            </p>
          </div>
          <Button label="New Link" icon="plus" onClick={onCreateLink} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Bookings" value="23"  sub="this month" icon="calendar" color={T.blue} />
          <StatCard label="Active Links"   value="2"   sub="of 3 links" icon="link"     color={T.green} />
          <StatCard label="Team Members"   value="3"   sub="on your team" icon="users" color={T.purple} />
          <StatCard label="Time Saved"     value="4.2h" sub="vs. email" icon="clock"    color={T.amber} />
        </div>

        {/* Two-column: Links + Upcoming */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Booking Links */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
                Booking Links
              </h2>
              <Button label="Create" icon="plus" size="sm" onClick={onCreateLink} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_LINKS.map(link => (
                <div key={link.id} style={{
                  background: T.navy, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: 16,
                  borderLeft: `3px solid ${link.active ? link.color : T.textLight}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
                          {link.title}
                        </span>
                        <Badge label={link.active ? "ACTIVE" : "PAUSED"} color={link.active ? T.green : T.textLight} />
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.textMid }}>
                        <span><Icon name="clock" size={11} color={T.textMid} /> {link.duration} min</span>
                        <span><Icon name="users" size={11} color={T.textMid} /> {link.team.length + 1} calendars</span>
                        <span><Icon name="calendar" size={11} color={T.textMid} /> {link.bookings} booked</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleCopy(link.slug)} style={{
                        background: "transparent", border: `1px solid ${T.border}`,
                        borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                        color: copied === link.slug ? T.green : T.textMid,
                      }}>
                        <Icon name={copied === link.slug ? "check" : "copy"} size={13} color={copied === link.slug ? T.green : T.textMid} />
                      </button>
                      <button onClick={() => onOpenLink(link.slug)} style={{
                        background: T.blue + "20", border: `1px solid ${T.blue}44`,
                        borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                        fontSize: 12, color: T.blue, fontWeight: 600,
                      }}>
                        Open →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming bookings */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
                Upcoming
              </h2>
              <Badge label={`${MOCK_UPCOMING.length} this week`} color={T.blue} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MOCK_UPCOMING.map(b => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: T.navy, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "12px 14px",
                }}>
                  <Avatar initials={b.avatar} color={b.color} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
                      {b.guest}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMid }}>{b.company} · {b.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{b.time}</div>
                    <div style={{ fontSize: 11, color: T.textMid }}>{b.tz} · {b.duration}m</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// PUBLIC BOOKING PAGE
function BookingPage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const link = MOCK_LINKS.find(l => l.slug === slug) ?? MOCK_LINKS[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"slots" | "form" | "confirm">("slots");
  const [formData, setFormData] = useState({ name: "", email: "", notes: "" });
  const [tz, setTz] = useState("America/Los_Angeles");
  const [viewTz, setViewTz] = useState(false);

  const dates = Object.keys(slotsByDate).slice(0, 10);

  const handleBook = () => {
    if (!formData.name || !formData.email) return;
    setStep("confirm");
  };

  if (step === "confirm") {
    return (
      <div style={{ minHeight: "100vh", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: T.green + "20", border: `2px solid ${T.green}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Icon name="check" size={36} color={T.green} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.white, margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>
            You're confirmed! 🎉
          </h1>
          <p style={{ color: T.textMid, marginBottom: 28, lineHeight: 1.6, fontSize: 15 }}>
            Your {link.duration}-min {link.title} is booked for<br />
            <strong style={{ color: T.text }}>{selectedDate} at {selectedSlot} PST</strong>
          </p>
          <Card style={{ textAlign: "left", marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: T.textMid, marginBottom: 12, fontWeight: 600 }}>BOOKING DETAILS</div>
            {[
              { l: "Guest",    v: formData.name },
              { l: "Email",    v: formData.email },
              { l: "Meeting",  v: link.title },
              { l: "Duration", v: `${link.duration} minutes` },
              { l: "Time",     v: `${selectedDate} · ${selectedSlot} PST` },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <span style={{ color: T.textMid }}>{r.l}</span>
                <span style={{ color: T.text, fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </Card>
          <p style={{ fontSize: 13, color: T.textMid, marginBottom: 24 }}>
            A confirmation email with a calendar invite has been sent to <strong style={{ color: T.text }}>{formData.email}</strong>
          </p>
          <Button label="← Back to Dashboard" variant="secondary" onClick={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.navy, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.white }}>
          Cal<span style={{ color: T.electric }}>BUDI</span>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer", fontSize: 13 }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>

        {/* Left: Link info */}
        <div>
          <div style={{ position: "sticky", top: 40 }}>
            <Avatar initials="SC" color={T.blue} size={52} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "16px 0 4px" }}>{link.title}</h1>
            <div style={{ display: "flex", gap: 12, fontSize: 13, color: T.textMid, marginBottom: 16 }}>
              <span>⏱ {link.duration} min</span>
              <span>📹 Video call</span>
            </div>
            <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginBottom: 20 }}>
              Book a time with Sarah and her team. All team members' calendars are automatically checked for mutual availability.
            </div>

            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMid, fontWeight: 600, marginBottom: 8 }}>CHECKING CALENDARS</div>
              {["Sarah Chen (Host)", ...link.team].map((name, i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
                  <span style={{ fontSize: 13, color: T.text }}>{name}</span>
                </div>
              ))}
            </div>

            {/* Timezone */}
            <div style={{ fontSize: 12, color: T.textMid }}>
              <div style={{ marginBottom: 4 }}>Your timezone:</div>
              <select value={tz} onChange={e => setTz(e.target.value)} style={{
                background: T.inputBg, border: `1px solid ${T.border}`,
                color: T.text, borderRadius: 6, padding: "6px 10px", fontSize: 12, width: "100%",
              }}>
                <option value="America/Los_Angeles">PST (Los Angeles)</option>
                <option value="America/New_York">EST (New York)</option>
                <option value="America/Chicago">CST (Chicago)</option>
                <option value="Europe/London">GMT (London)</option>
                <option value="Asia/Tokyo">JST (Tokyo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Slots or form */}
        {step === "slots" ? (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 20px" }}>
              Select a Date & Time
            </h2>
            {dates.map(date => (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textMid, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {date}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {slotsByDate[date].map(slot => {
                    const isSelected = selectedDate === date && selectedSlot === slot.time;
                    return (
                      <button
                        key={`${date}-${slot.time}`}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(slot.time); }}
                        style={{
                          background: isSelected ? T.blue : T.cardBg,
                          border: `1px solid ${isSelected ? T.blue : T.border}`,
                          borderRadius: 8, padding: "10px 6px",
                          cursor: "pointer", fontSize: 13,
                          color: isSelected ? "#fff" : T.text,
                          fontWeight: isSelected ? 600 : 400,
                          transition: "all 0.15s ease",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 24 }}>
              <Button
                label="Confirm Time →"
                onClick={() => selectedSlot && setStep("form")}
                disabled={!selectedSlot}
                size="lg"
              />
              {selectedSlot && (
                <div style={{ fontSize: 13, color: T.textMid, marginTop: 10 }}>
                  Selected: <strong style={{ color: T.text }}>{selectedDate} at {selectedSlot} PST</strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Form
          <div>
            <button onClick={() => setStep("slots")} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>
              ← Change time
            </button>
            <div style={{ background: T.cardBg, border: `1px solid ${T.green}44`, borderRadius: 10, padding: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="check" size={16} color={T.green} />
              <span style={{ fontSize: 14, color: T.text }}>
                <strong>{selectedDate} at {selectedSlot} PST</strong> · {link.duration} min
              </span>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 20px" }}>
              Enter Your Details
            </h2>

            {[
              { label: "Your Name", key: "name", placeholder: "Jane Smith", type: "text" },
              { label: "Email Address", key: "email", placeholder: "jane@company.com", type: "email" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 6 }}>
                  {field.label} *
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(formData as any)[field.key]}
                  onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: "100%", background: T.inputBg, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "11px 14px", color: T.text, fontSize: 14,
                    outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 6 }}>
                Additional Notes (optional)
              </label>
              <textarea
                placeholder="Anything you'd like us to know..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                style={{
                  width: "100%", background: T.inputBg, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "11px 14px", color: T.text, fontSize: 14,
                  outline: "none", fontFamily: "'DM Sans', sans-serif", resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <Button
              label="Confirm Booking →"
              size="lg"
              onClick={handleBook}
              disabled={!formData.name || !formData.email}
            />
            <p style={{ fontSize: 12, color: T.textLight, marginTop: 12 }}>
              By booking, you agree to the CalBUDI Terms of Service. A calendar invite will be emailed to all participants.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// NFC DEMO SCREEN
function NfcDemo({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "matched" | "confirmed">("idle");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const nfcSlots = [
    { time: "Today, 3:00 PM PST",      label: "In 2 hours", mutual: true },
    { time: "Tomorrow, 9:30 AM PST",   label: "Tomorrow morning", mutual: true },
    { time: "Tomorrow, 2:00 PM PST",   label: "Tomorrow afternoon", mutual: true },
  ];

  const handleTap = () => {
    setPhase("scanning");
    setTimeout(() => setPhase("matched"), 2000);
  };

  const handleConfirm = (i: number) => {
    setSelectedSlot(i);
    setPhase("confirmed");
  };

  return (
    <div style={{ minHeight: "100vh", background: T.navy, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>NFC Tap-to-Meet</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        {phase === "idle" && (
          <>
            <div style={{ fontSize: 14, color: T.textMid, marginBottom: 40, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              Hold your phone near a colleague's phone. CalBUDI will instantly find your first mutual available time.
            </div>
            <div
              onClick={handleTap}
              style={{
                width: 180, height: 180, borderRadius: "50%",
                border: `2px solid ${T.electric}`,
                background: `radial-gradient(circle, ${T.electric}15, transparent 70%)`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", animation: "pulse 2s infinite",
              }}
            >
              <Icon name="nfc" size={56} color={T.electric} />
              <div style={{ fontSize: 13, color: T.electric, marginTop: 8, fontWeight: 600 }}>TAP TO MEET</div>
            </div>
            <div style={{ fontSize: 12, color: T.textLight, marginTop: 24 }}>Tap the circle to simulate an NFC tap</div>
          </>
        )}

        {phase === "scanning" && (
          <>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: `2px solid ${T.blue}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "spin 1s linear infinite" }}>
              <Icon name="clock" size={40} color={T.blue} />
            </div>
            <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>Detecting nearby device...</div>
            <div style={{ fontSize: 13, color: T.textMid, marginTop: 8 }}>Checking mutual availability across all calendars</div>
          </>
        )}

        {phase === "matched" && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Mutual times found! ⚡</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <Avatar initials="SC" color={T.blue} size={36} />
              <div style={{ width: 40, height: 1, background: T.electric }} />
              <div style={{ fontSize: 12, color: T.electric, fontWeight: 700 }}>CONNECTED</div>
              <div style={{ width: 40, height: 1, background: T.electric }} />
              <Avatar initials="MJ" color={T.green} size={36} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
              {nfcSlots.map((slot, i) => (
                <div
                  key={i}
                  onClick={() => handleConfirm(i)}
                  style={{
                    background: T.cardBg, border: `1px solid ${T.blue}44`,
                    borderRadius: 12, padding: "16px 20px",
                    cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{slot.time}</div>
                    <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{slot.label} · 30 min</div>
                  </div>
                  <div style={{ background: T.blue + "20", border: `1px solid ${T.blue}44`, borderRadius: 6, padding: "4px 10px", fontSize: 12, color: T.blue, fontWeight: 600 }}>
                    Book
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === "confirmed" && selectedSlot !== null && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.green + "20", border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Icon name="check" size={36} color={T.green} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.white, marginBottom: 8, textAlign: "center" }}>Booked in &lt;30 seconds! 🎉</div>
            <div style={{ fontSize: 15, color: T.textMid, marginBottom: 32, textAlign: "center" }}>
              {nfcSlots[selectedSlot].time}<br />
              <span style={{ color: T.green }}>Calendar invites sent to both of you</span>
            </div>
            <Button label="← Back to Dashboard" variant="secondary" onClick={onBack} />
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// CREATE LINK MODAL
function CreateLinkModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: "", duration: "30", team: [] as string[] });
  const teammates = ["AE John", "SE Mike", "SDR Alex", "AE Linda"];

  const toggleTeam = (name: string) => {
    setForm(prev => ({
      ...prev,
      team: prev.team.includes(name) ? prev.team.filter(t => t !== name) : [...prev.team, name],
    }));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
            Create Booking Link
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMid }}>
            <Icon name="x" size={20} color={T.textMid} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 6 }}>Meeting Title *</label>
          <input
            placeholder="e.g. 30-Min Intro Call"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 6 }}>Duration</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["15", "30", "45", "60"].map(d => (
              <button key={d} onClick={() => setForm(prev => ({ ...prev, duration: d }))} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                background: form.duration === d ? T.blue : T.inputBg,
                border: `1px solid ${form.duration === d ? T.blue : T.border}`,
                color: form.duration === d ? "#fff" : T.textMid,
                fontSize: 14, fontWeight: 600,
              }}>
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: T.textMid, fontWeight: 600, marginBottom: 8 }}>
            Add Team Members <span style={{ color: T.textLight }}>(their calendars will be checked)</span>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {teammates.map(name => (
              <div
                key={name}
                onClick={() => toggleTeam(name)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                  background: form.team.includes(name) ? T.blue + "15" : T.inputBg,
                  border: `1px solid ${form.team.includes(name) ? T.blue + "66" : T.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={name.split(" ").map(w => w[0]).join("")} size={28} />
                  <span style={{ fontSize: 14, color: T.text }}>{name}</span>
                </div>
                {form.team.includes(name) && <Icon name="check" size={16} color={T.blue} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button label="Cancel" variant="ghost" onClick={onClose} />
          <Button label="Create Link →" onClick={onClose} disabled={!form.title} />
        </div>
      </div>
    </div>
  );
}

// ── App Router ────────────────────────────────────────────────────────────────
export default function CalBUDIApp() {
  const [screen, setScreen] = useState<"landing" | "dashboard" | "booking" | "nfc">("landing");
  const [bookingSlug, setBookingSlug] = useState("sarah-30min");
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #0D1B2E; }
        input, select, textarea, button { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 3px; }
      `}</style>

      {screen === "landing" && (
        <LandingPage onEnter={() => setScreen("dashboard")} />
      )}
      {screen === "dashboard" && (
        <Dashboard
          onCreateLink={() => setShowCreateModal(true)}
          onOpenLink={(slug) => { setBookingSlug(slug); setScreen("booking"); }}
          onNfc={() => setScreen("nfc")}
        />
      )}
      {screen === "booking" && (
        <BookingPage slug={bookingSlug} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "nfc" && (
        <NfcDemo onBack={() => setScreen("dashboard")} />
      )}
      {showCreateModal && (
        <CreateLinkModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
