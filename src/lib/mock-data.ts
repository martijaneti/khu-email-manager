export interface AIReplies {
  positive: string;
  neutral: string;
  negative: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  lastMessage: {
    from: string;
    fromEmail: string;
    preview: string;
    body: string;
    date: Date;
  };
  messages: EmailMessage[];
  unread: boolean;
  starred?: boolean;
  labels: string[];
  hasAttachments: boolean;
  aiSummary?: string;
  aiReplies?: AIReplies;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string[];
  date: Date;
  body: string;
  attachments?: { name: string; size: string; type: string }[];
}

export interface SentEmail {
  id: string;
  to: string[];
  toNames: string[];
  subject: string;
  preview: string;
  body: string;
  sentAt: Date;
  hasAttachments: boolean;
  attachments?: { name: string; size: string; type: string }[];
}

export interface ScheduledEmail {
  id: string;
  to: string;
  subject: string;
  preview: string;
  scheduledFor: Date;
  kind: "reply" | "followup";
  threadId?: string;
}

export const MOCK_THREADS: EmailThread[] = [
  {
    id: "t1",
    subject: "Q2 Partnership Proposal — Follow-up needed",
    participants: ["Sarah Chen", "you"],
    unread: true,
    starred: true,
    labels: ["important"],
    hasAttachments: true,
    aiSummary: "Sarah is following up on last week's partnership proposal and has attached an updated version with revised pricing. She's looking for a response on the terms.",
    lastMessage: {
      from: "Sarah Chen",
      fromEmail: "sarah@acmecorp.com",
      preview: "Hi, I wanted to follow up on the proposal I sent last week. Have you had a chance to review the terms?",
      body: `Hi,

I wanted to follow up on the proposal I sent last week. Have you had a chance to review the terms? We're really excited about the potential partnership and would love to hear your thoughts.

I've attached the updated version with the pricing adjustments we discussed.

Looking forward to hearing from you!

Best,
Sarah Chen
Head of Partnerships, ACME Corp`,
      date: new Date(Date.now() - 1000 * 60 * 45),
    },
    messages: [
      {
        id: "m1a",
        from: "Sarah Chen",
        fromEmail: "sarah@acmecorp.com",
        to: ["you@gmail.com"],
        date: new Date(Date.now() - 1000 * 60 * 60 * 72),
        body: `Hi,

Please find attached our Q2 partnership proposal. We believe this could be a great opportunity for both of our companies.

Let me know if you have any questions!

Best,
Sarah`,
        attachments: [{ name: "Q2_Partnership_Proposal.pdf", size: "2.4 MB", type: "pdf" }],
      },
      {
        id: "m1b",
        from: "Sarah Chen",
        fromEmail: "sarah@acmecorp.com",
        to: ["you@gmail.com"],
        date: new Date(Date.now() - 1000 * 60 * 45),
        body: `Hi,

I wanted to follow up on the proposal I sent last week. Have you had a chance to review the terms? We're really excited about the potential partnership and would love to hear your thoughts.

I've attached the updated version with the pricing adjustments we discussed.

Looking forward to hearing from you!

Best,
Sarah Chen
Head of Partnerships, ACME Corp`,
        attachments: [{ name: "Q2_Partnership_Proposal_v2.pdf", size: "2.6 MB", type: "pdf" }],
      },
    ],
  },
  {
    id: "t2",
    subject: "Invoice #4821 — Payment Confirmation",
    participants: ["billing@stripe.com", "you"],
    unread: false,
    labels: ["finance"],
    hasAttachments: true,
    lastMessage: {
      from: "Stripe",
      fromEmail: "billing@stripe.com",
      preview: "Your payment of $299.00 for the Pro plan has been confirmed. Your receipt is attached.",
      body: `Your payment of $299.00 for the Pro plan has been confirmed. Your receipt is attached.

Thank you for your business!

The Stripe Team`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    messages: [
      {
        id: "m2a",
        from: "Stripe",
        fromEmail: "billing@stripe.com",
        to: ["you@gmail.com"],
        date: new Date(Date.now() - 1000 * 60 * 60 * 3),
        body: `Your payment of $299.00 for the Pro plan has been confirmed. Your receipt is attached.

Thank you for your business!

The Stripe Team`,
        attachments: [{ name: "receipt_4821.pdf", size: "156 KB", type: "pdf" }],
      },
    ],
  },
  {
    id: "t3",
    subject: "Team standup notes — May 12",
    participants: ["Alex Kim", "Priya Patel", "you"],
    unread: true,
    labels: ["work"],
    hasAttachments: false,
    aiSummary: "Team standup notes covering blockers (design review, flaky CI), completed items (v2.1 launch, auth fix), and today's action items for Alex, Priya, and you (quarterly report draft).",
    lastMessage: {
      from: "Alex Kim",
      fromEmail: "alex@team.com",
      preview: "Here are the notes from today's standup. Action items are highlighted in bold.",
      body: `Here are the notes from today's standup. Action items are highlighted in bold.

**Blockers:**
- Priya: waiting on design review for the new onboarding flow
- Alex: CI pipeline flaky on integration tests

**Completed:**
- Launched v2.1 to 10% of users ✓
- Fixed the auth session expiry bug ✓

**Today:**
- Alex: fix CI, review PR #142
- Priya: unblock design, start API integration
- You: quarterly report draft

Let me know if I missed anything!`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    messages: [
      {
        id: "m3a",
        from: "Alex Kim",
        fromEmail: "alex@team.com",
        to: ["you@gmail.com", "priya@team.com"],
        date: new Date(Date.now() - 1000 * 60 * 60 * 5),
        body: `Here are the notes from today's standup. Action items are highlighted in bold.

**Blockers:**
- Priya: waiting on design review for the new onboarding flow
- Alex: CI pipeline flaky on integration tests

**Completed:**
- Launched v2.1 to 10% of users ✓
- Fixed the auth session expiry bug ✓

**Today:**
- Alex: fix CI, review PR #142
- Priya: unblock design, start API integration
- You: quarterly report draft

Let me know if I missed anything!`,
      },
    ],
  },
  {
    id: "t4",
    subject: "Your GitHub Copilot subscription renewal",
    participants: ["GitHub", "you"],
    unread: false,
    labels: ["finance"],
    hasAttachments: false,
    lastMessage: {
      from: "GitHub",
      fromEmail: "noreply@github.com",
      preview: "Your GitHub Copilot Individual subscription will renew on June 1, 2026 for $10.00/month.",
      body: `Your GitHub Copilot Individual subscription will renew on June 1, 2026 for $10.00/month.

No action is needed — we'll charge your card on file.

Manage your subscription at github.com/settings/billing.

— The GitHub Team`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    messages: [
      {
        id: "m4a",
        from: "GitHub",
        fromEmail: "noreply@github.com",
        to: ["you@gmail.com"],
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        body: `Your GitHub Copilot Individual subscription will renew on June 1, 2026 for $10.00/month.

No action is needed — we'll charge your card on file.

Manage your subscription at github.com/settings/billing.

— The GitHub Team`,
      },
    ],
  },
  {
    id: "t5",
    subject: "Coffee chat this week?",
    participants: ["marco@startup.io", "you"],
    unread: true,
    labels: [],
    hasAttachments: false,
    lastMessage: {
      from: "Marco Rivera",
      fromEmail: "marco@startup.io",
      preview: "Hey! Would you be up for a quick 30-min coffee chat this week? I'd love to pick your brain about go-to-market.",
      body: `Hey!

Would you be up for a quick 30-min coffee chat this week? I'd love to pick your brain about go-to-market strategies for developer tools.

Any time Thursday or Friday works great for me. Let me know!

Marco`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 30),
    },
    messages: [
      {
        id: "m5a",
        from: "Marco Rivera",
        fromEmail: "marco@startup.io",
        to: ["you@gmail.com"],
        date: new Date(Date.now() - 1000 * 60 * 60 * 30),
        body: `Hey!

Would you be up for a quick 30-min coffee chat this week? I'd love to pick your brain about go-to-market strategies for developer tools.

Any time Thursday or Friday works great for me. Let me know!

Marco`,
      },
    ],
  },
];

export const MOCK_SENT: SentEmail[] = [
  {
    id: "se1",
    to: ["sarah@acmecorp.com"],
    toNames: ["Sarah Chen"],
    subject: "Re: Q2 Partnership Proposal — Follow-up needed",
    preview: "Hi Sarah, thanks for following up! I've had a chance to review the proposal and I'm excited about the potential...",
    body: `Hi Sarah,

Thanks for following up! I've had a chance to review the proposal and I'm excited about the potential here.

The revised pricing looks reasonable. I do have a few questions about the exclusivity clause in section 3 — can we hop on a quick call this week to discuss?

Thursday 2pm or Friday 10am work for me.

Best,
Marti`,
    sentAt: new Date(Date.now() - 1000 * 60 * 30),
    hasAttachments: false,
  },
  {
    id: "se2",
    to: ["alex@team.com", "priya@team.com"],
    toNames: ["Alex Kim", "Priya Patel"],
    subject: "Re: Team standup notes — May 12",
    preview: "Hey team, thanks for the notes! I'll have the quarterly report draft ready by EOD Friday...",
    body: `Hey team,

Thanks for the notes! I'll have the quarterly report draft ready by EOD Friday.

Also flagging: I noticed the CI issue might be related to the env var change last Tuesday. Worth checking that first before digging deeper.

Let me know if you need anything.`,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    hasAttachments: false,
  },
  {
    id: "se3",
    to: ["marco@startup.io"],
    toNames: ["Marco Rivera"],
    subject: "Re: Coffee chat this week?",
    preview: "Hey Marco! Thursday at 3pm works perfectly for me. I'll send a calendar invite...",
    body: `Hey Marco!

Thursday at 3pm works perfectly for me. I'll send a calendar invite.

Happy to share what's worked (and what hasn't) for go-to-market with developer tools — it's a topic I find endlessly interesting.

See you then!

Marti`,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 28),
    hasAttachments: false,
  },
  {
    id: "se4",
    to: ["team@khu.io"],
    toNames: ["KHU Team"],
    subject: "Q1 Metrics Review — Action Items",
    preview: "Hi all, attaching the Q1 metrics deck from today's review session. Key takeaways...",
    body: `Hi all,

Attaching the Q1 metrics deck from today's review session.

Key takeaways:
- DAU up 18% QoQ — strong growth from the product-led motion
- Churn ticked up to 4.2% — need to address onboarding friction
- NPS held steady at 42

Action items are in the deck. Owners: please update Notion by EOW.

Thanks everyone!`,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    hasAttachments: true,
    attachments: [{ name: "Q1_Metrics_Review.pdf", size: "3.1 MB", type: "pdf" }],
  },
];

export const MOCK_SCHEDULED: ScheduledEmail[] = [
  {
    id: "s1",
    to: "sarah@acmecorp.com",
    subject: "Re: Q2 Partnership Proposal — Follow-up needed",
    preview: "Hi Sarah, thanks for following up! I've reviewed the proposal and...",
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 3),
    kind: "reply",
    threadId: "t1",
  },
  {
    id: "s2",
    to: "marco@startup.io",
    subject: "Re: Coffee chat this week?",
    preview: "Hey Marco! Thursday at 3pm works perfectly for me...",
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 18),
    kind: "followup",
    threadId: "t5",
  },
];

export interface Contact {
  name: string;
  email: string;
}

export const KNOWN_CONTACTS: Contact[] = [
  { name: "Sarah Chen", email: "sarah@acmecorp.com" },
  { name: "Stripe Billing", email: "billing@stripe.com" },
  { name: "Alex Kim", email: "alex@team.com" },
  { name: "Priya Patel", email: "priya@team.com" },
  { name: "GitHub", email: "noreply@github.com" },
  { name: "Marco Rivera", email: "marco@startup.io" },
];

function autoLabel(subject: string, body: string): string[] {
  const text = `${subject} ${body}`.toLowerCase();
  const labels: string[] = [];
  if (/invoice|payment|receipt|billing|subscription|charge|refund|stripe|paypal|bank|statement/.test(text)) labels.push("finance");
  else if (/meeting|standup|stand-up|pull request|sprint|deploy|release|quarterly|report|pipeline|ci\/cd|jira|ticket/.test(text)) labels.push("work");
  else if (/flight|hotel|booking|reservation|trip|itinerary|departure|arrival|airbnb|airline|passport/.test(text)) labels.push("travel");
  return labels;
}

const NEW_EMAIL_POOL: Omit<EmailThread, "id" | "labels">[] = [
  {
    subject: "Quick question about your availability",
    participants: ["Jamie Lee", "you"],
    unread: true,
    starred: false,
    hasAttachments: false,
    lastMessage: {
      from: "Jamie Lee",
      fromEmail: "jamie@design.co",
      preview: "Hey! Are you free for a quick 15-min sync this week? I have some ideas I'd love to bounce off you.",
      body: `Hey!

Are you free for a quick 15-min sync this week? I have some ideas I'd love to bounce off you.

Tuesday or Wednesday afternoon work best for me.

Jamie`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m1",
        from: "Jamie Lee",
        fromEmail: "jamie@design.co",
        to: ["you@gmail.com"],
        date: new Date(),
        body: `Hey!

Are you free for a quick 15-min sync this week? I have some ideas I'd love to bounce off you.

Tuesday or Wednesday afternoon work best for me.

Jamie`,
      },
    ],
  },
  {
    subject: "Your order has shipped!",
    participants: ["Shop.io Orders", "you"],
    unread: true,
    starred: false,
    hasAttachments: false,
    lastMessage: {
      from: "Shop.io Orders",
      fromEmail: "orders@shop.io",
      preview: "Your order #78421 has shipped and is on its way. Estimated delivery: 2-3 business days.",
      body: `Your order #78421 has shipped and is on its way.

Estimated delivery: 2-3 business days.

Track your package at track.shop.io/78421

Thank you for your purchase!

— The Shop.io Team`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m2",
        from: "Shop.io Orders",
        fromEmail: "orders@shop.io",
        to: ["you@gmail.com"],
        date: new Date(),
        body: `Your order #78421 has shipped and is on its way.

Estimated delivery: 2-3 business days.

Track your package at track.shop.io/78421

Thank you for your purchase!

— The Shop.io Team`,
      },
    ],
  },
  {
    subject: "Invoice #2847 from Vercel — payment due",
    participants: ["billing@vercel.com", "you"],
    unread: true,
    starred: false,
    hasAttachments: true,
    aiSummary: "Vercel has sent invoice #2847 for $49/mo Pro plan. Payment is due in 7 days.",
    lastMessage: {
      from: "Vercel Billing",
      fromEmail: "billing@vercel.com",
      preview: "Your invoice #2847 for $49.00 is ready. Payment due in 7 days.",
      body: `Hi there,

Your invoice #2847 is ready.

**Plan:** Pro (monthly)
**Amount:** $49.00
**Due:** 7 days from today

You can view and download your invoice from the billing dashboard.

— Vercel Billing`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m3",
        from: "Vercel Billing",
        fromEmail: "billing@vercel.com",
        to: ["you@gmail.com"],
        date: new Date(),
        attachments: [{ name: "invoice-2847.pdf", size: "98 KB", type: "pdf" }],
        body: `Hi there,

Your invoice #2847 is ready.

**Plan:** Pro (monthly)
**Amount:** $49.00
**Due:** 7 days from today

You can view and download your invoice from the billing dashboard.

— Vercel Billing`,
      },
    ],
  },
  {
    subject: "Sprint planning standup — notes & next steps",
    participants: ["Alex Kim", "Priya Patel", "you"],
    unread: true,
    starred: false,
    hasAttachments: false,
    aiSummary: "Alex shared sprint planning notes. Key items: finalize Q2 roadmap, unblock CI pipeline issue, schedule design review by Friday.",
    lastMessage: {
      from: "Alex Kim",
      fromEmail: "alex@team.com",
      preview: "Hey team, sharing the standup notes from today. Three key items need action this week.",
      body: `Hey team,

Sharing the standup notes from today's sprint planning.

**Action items this week:**
- Finalize Q2 roadmap (owner: Priya, due Thu)
- Unblock CI pipeline — the deploy is stuck on the env var issue
- Schedule design review by Friday

I'll send a calendar invite for the design review once everyone confirms availability.

Alex`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m4",
        from: "Alex Kim",
        fromEmail: "alex@team.com",
        to: ["you@gmail.com", "priya@team.com"],
        date: new Date(),
        body: `Hey team,

Sharing the standup notes from today's sprint planning.

**Action items this week:**
- Finalize Q2 roadmap (owner: Priya, due Thu)
- Unblock CI pipeline — the deploy is stuck on the env var issue
- Schedule design review by Friday

I'll send a calendar invite for the design review once everyone confirms availability.

Alex`,
      },
    ],
  },
  {
    subject: "Flight confirmation — SFO → JFK, May 20",
    participants: ["noreply@airline.com", "you"],
    unread: true,
    starred: false,
    hasAttachments: true,
    aiSummary: "Flight booking confirmed: SFO to JFK on May 20, departing 8:15 AM. Booking reference KHU429.",
    lastMessage: {
      from: "United Airlines",
      fromEmail: "noreply@airline.com",
      preview: "Your flight SFO → JFK on May 20 is confirmed. Booking reference: KHU429.",
      body: `Your booking is confirmed!

**Flight:** UA 412
**Route:** SFO → JFK
**Date:** May 20
**Departure:** 8:15 AM
**Arrival:** 4:42 PM
**Booking ref:** KHU429

Check in online starting 24 hours before departure. Don't forget your passport!

Safe travels,
United Airlines`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m5",
        from: "United Airlines",
        fromEmail: "noreply@airline.com",
        to: ["you@gmail.com"],
        date: new Date(),
        attachments: [{ name: "boarding-pass-KHU429.pdf", size: "210 KB", type: "pdf" }],
        body: `Your booking is confirmed!

**Flight:** UA 412
**Route:** SFO → JFK
**Date:** May 20
**Departure:** 8:15 AM
**Arrival:** 4:42 PM
**Booking ref:** KHU429

Check in online starting 24 hours before departure. Don't forget your passport!

Safe travels,
United Airlines`,
      },
    ],
  },
  {
    subject: "Pull request review requested — feat/user-settings",
    participants: ["noreply@github.com", "you"],
    unread: true,
    starred: false,
    hasAttachments: false,
    aiSummary: "Priya Patel requested your review on the feat/user-settings pull request. 3 files changed, 142 additions.",
    lastMessage: {
      from: "GitHub",
      fromEmail: "noreply@github.com",
      preview: "Priya Patel requested your review on pull request #142: feat/user-settings.",
      body: `Priya Patel requested your review on:

**feat/user-settings** (#142)

> Adds user-level density and notification preferences to the settings panel. Persists to localStorage.

**Changes:** 3 files, +142 −18

View the pull request on GitHub to leave your review.

— GitHub`,
      date: new Date(),
    },
    messages: [
      {
        id: "new_m6",
        from: "GitHub",
        fromEmail: "noreply@github.com",
        to: ["you@gmail.com"],
        date: new Date(),
        body: `Priya Patel requested your review on:

**feat/user-settings** (#142)

> Adds user-level density and notification preferences to the settings panel. Persists to localStorage.

**Changes:** 3 files, +142 −18

View the pull request on GitHub to leave your review.

— GitHub`,
      },
    ],
  },
];

let newEmailIdx = 0;
export function generateNewEmail(): EmailThread {
  const template = NEW_EMAIL_POOL[newEmailIdx % NEW_EMAIL_POOL.length];
  newEmailIdx++;
  const now = new Date();
  const labels = autoLabel(template.subject, template.lastMessage.body);
  return {
    ...template,
    labels,
    id: `new_${Date.now()}`,
    lastMessage: { ...template.lastMessage, date: now },
    messages: template.messages.map((m) => ({ ...m, id: `${m.id}_${Date.now()}`, date: now })),
  };
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatScheduledTime(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "in less than 1 hour";
  if (hours < 24) return `in ${hours} hours`;
  if (days === 1) return "tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500",
    "bg-orange-500", "bg-pink-500", "bg-teal-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
