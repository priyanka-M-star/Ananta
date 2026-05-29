"""
Ananta - AI Tutoring Platform
Architecture Document PDF generator.

USAGE (on your machine, Python 3.10+):
    pip install reportlab
    python build_pdf.py

Output: Ananta_Architecture.pdf in the same folder.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, ListFlowable, ListItem, HRFlowable
)

OUTPUT = "Ananta_Architecture.pdf"

INDIGO = HexColor("#1E3A8A")
SAFFRON = HexColor("#F59E0B")
TEAL = HexColor("#0D9488")
SLATE = HexColor("#334155")
LIGHT_BG = HexColor("#F1F5F9")
GREY_BORDER = HexColor("#CBD5E1")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=28, textColor=white, leading=34, alignment=TA_LEFT, spaceAfter=6)
subtitle_style = ParagraphStyle("Sub", fontName="Helvetica", fontSize=14,
    textColor=HexColor("#E0E7FF"), leading=18, alignment=TA_LEFT, spaceAfter=4)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=20, textColor=INDIGO, spaceBefore=16, spaceAfter=10, leading=24)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=15, textColor=TEAL, spaceBefore=12, spaceAfter=6, leading=19)
body = ParagraphStyle("Body", fontName="Helvetica", fontSize=10.5, textColor=black,
    leading=15, alignment=TA_JUSTIFY, spaceAfter=6)
bullet = ParagraphStyle("Bullet", fontName="Helvetica", fontSize=10.5, textColor=black,
    leading=14, leftIndent=14, bulletIndent=2, spaceAfter=3)
small = ParagraphStyle("Small", fontName="Helvetica", fontSize=9, textColor=SLATE, leading=12)
quote = ParagraphStyle("Quote", fontName="Helvetica-Oblique", fontSize=11, textColor=SLATE,
    leading=15, leftIndent=16, rightIndent=16, spaceAfter=8)


def cover_canvas(canv, doc):
    canv.saveState()
    width, height = A4
    canv.setFillColor(INDIGO)
    canv.rect(0, height - 9 * cm, width, 9 * cm, fill=1, stroke=0)
    canv.setFillColor(SAFFRON)
    canv.rect(0, height - 9.4 * cm, width, 0.4 * cm, fill=1, stroke=0)
    canv.restoreState()


def page_canvas(canv, doc):
    canv.saveState()
    width, height = A4
    canv.setFillColor(INDIGO)
    canv.rect(0, height - 1.3 * cm, width, 1.3 * cm, fill=1, stroke=0)
    canv.setFillColor(white)
    canv.setFont("Helvetica-Bold", 11)
    canv.drawString(2 * cm, height - 0.85 * cm, "ANANTA")
    canv.setFont("Helvetica", 9)
    canv.drawString(3.5 * cm, height - 0.85 * cm, "AI Tutoring Platform - System Architecture")
    canv.setFillColor(SAFFRON)
    canv.rect(0, height - 1.4 * cm, width, 0.1 * cm, fill=1, stroke=0)
    canv.setFillColor(SLATE)
    canv.setFont("Helvetica", 8.5)
    canv.drawString(2 * cm, 1 * cm, "Ananta - Confidential Architecture Document")
    canv.drawRightString(width - 2 * cm, 1 * cm, f"Page {doc.page}")
    canv.setStrokeColor(GREY_BORDER)
    canv.setLineWidth(0.4)
    canv.line(2 * cm, 1.3 * cm, width - 2 * cm, 1.3 * cm)
    canv.restoreState()


def make_table(data, col_widths, header=True, zebra=True):
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    style = [
        ("FONT", (0, 0), (-1, -1), "Helvetica", 9.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_BORDER),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 10),
        ]
    if zebra:
        start = 1 if header else 0
        for i in range(start, len(data)):
            if (i - start) % 2 == 1:
                style.append(("BACKGROUND", (0, i), (-1, i), LIGHT_BG))
    t.setStyle(TableStyle(style))
    return t


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(it, bullet), leftIndent=10, value="bullet") for it in items],
        bulletType="bullet", start="circle", leftIndent=12,
    )


doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=1.8 * cm, bottomMargin=1.6 * cm,
    title="Ananta - AI Tutoring Platform - Architecture")

story = []

# COVER
story.append(Spacer(1, 1.2 * cm))
story.append(Paragraph("ANANTA", title_style))
story.append(Paragraph("AI-Powered Tutoring Platform for Karnataka State Board", subtitle_style))
story.append(Paragraph("Full Production System Architecture", subtitle_style))
story.append(Spacer(1, 4 * cm))
cover_meta = [
    ["Project", "Ananta"],
    ["Document", "System Architecture - v1.0"],
    ["Target Audience", "Karnataka State Board - Grades 10, 11, 12"],
    ["Delivery Model", "AI Teachers with animated live classes"],
    ["Stack Preference", "Indian / Cost-optimized, Open-source heavy"],
    ["Document Date", "May 2026"],
    ["Status", "Draft for review"],
]
story.append(make_table(cover_meta, col_widths=[5 * cm, 11 * cm], header=False))
story.append(Spacer(1, 1.5 * cm))
story.append(Paragraph(
    "<i>\"Ananta\" (ಅನಂತ) means \"infinite\" in Sanskrit/Kannada - reflecting our mission to "
    "give every Karnataka student infinite access to quality teaching.</i>", quote))
story.append(PageBreak())

# 1. EXEC SUMMARY
story.append(Paragraph("1. Executive Summary", h1))
story.append(Paragraph(
    "Ananta is an AI-first online tutoring platform built specifically for students of the "
    "Karnataka State Board, covering Grades 10, 11 and 12. Unlike Byju's, Vedantu or Physics Wallah, "
    "Ananta has <b>no human teachers</b>. Every class is delivered by an AI teacher persona that "
    "explains concepts using animated scenes, simple language (so even a 5th-grade student can follow), "
    "and bilingual delivery in English and Kanglish (code-mixed Kannada-English).", body))
story.append(Paragraph(
    "Live classes run daily from <b>7:00 PM to 8:00 PM</b>, one subject per day. Every class is "
    "automatically recorded and published for on-demand viewing. Attendance is tracked, and parents "
    "are notified by WhatsApp/SMS if their child misses a class. Every Saturday, a 1-hour test is "
    "generated automatically from the week's curriculum and auto-graded by the AI.", body))

story.append(Paragraph("Key Differentiators", h2))
story.append(bullets([
    "<b>Hyper-localized</b>: Karnataka SSLC + PU curriculum, not generic CBSE.",
    "<b>Bilingual</b>: English + Kanglish, with Kannada TTS via open-source AI4Bharat models.",
    "<b>Animated AI teachers</b>: Every concept taught with auto-generated animations (Manim, Remotion).",
    "<b>Parent-in-the-loop</b>: Missed-class alerts and weekly progress reports built in.",
    "<b>Affordable</b>: Cost-optimized infrastructure - target subscription &lt; ₹499/month.",
]))

story.append(Paragraph("Target Operating Profile", h2))
story.append(make_table([
    ["Metric", "Year 1 Target", "Year 3 Target"],
    ["Active students", "5,000", "100,000"],
    ["Concurrent live viewers / class", "500", "10,000"],
    ["Subjects covered", "All (Grades 10, 11, 12)", "All + competitive prep"],
    ["Languages", "English, Kanglish", "+ Pure Kannada, Hindi"],
    ["Infra cost / student / month", "< ₹50", "< ₹20"],
], col_widths=[5.5 * cm, 5.5 * cm, 5.5 * cm]))

story.append(PageBreak())

# 2. SYSTEM OVERVIEW
story.append(Paragraph("2. High-Level System Overview", h1))
story.append(Paragraph(
    "Ananta is organized as loosely-coupled microservices behind an API Gateway, split into four "
    "logical planes:", body))
story.append(make_table([
    ["Plane", "Purpose", "Key Services"],
    ["Experience", "Apps used by students, parents, admins",
     "Student Web/PWA, Parent App, Admin Console"],
    ["Application", "Core business logic + APIs",
     "Identity, Curriculum, Scheduling, Attendance, Tests, Payments, Notifications"],
    ["AI", "AI teacher generation and live serving",
     "Lesson Gen, Animation Renderer, TTS, Avatar, Live Q&A, ASR"],
    ["Infrastructure", "Streaming, storage, CDN, observability",
     "LiveKit, MinIO/S3, BunnyCDN, Postgres, Redis, Kafka, Prometheus"],
], col_widths=[3.5 * cm, 5.5 * cm, 7.5 * cm]))

story.append(PageBreak())

# 3. TECH STACK
story.append(Paragraph("3. Technology Stack (Cost-Optimized for India)", h1))
story.append(Paragraph(
    "Every choice below favours open-source software and Indian cloud providers where possible.", body))
story.append(make_table([
    ["Layer", "Choice", "Why"],
    ["Student Web", "Next.js 14 + Tailwind (PWA)", "Single codebase web + mobile PWA."],
    ["Parent App", "React Native (Expo) + PWA", "One codebase iOS/Android."],
    ["API Gateway", "NestJS + JWT + Redis", "Mature; cheap scaling."],
    ["AI Services", "Python 3.12 + FastAPI + gRPC", "ML standard tooling."],
    ["LLM (lesson)", "Llama-3-70B self-hosted; cloud fallback", "Cheap GPU off-hours."],
    ["LLM (live Q&A)", "Llama-3-8B / Phi-3", "Runs on a single A10/L4."],
    ["TTS (KN/Kanglish)", "AI4Bharat IndicTTS / Parler-TTS", "Code-mixed input native."],
    ["TTS (EN)", "Coqui XTTS-v2 / Piper", "OSS, voice cloning."],
    ["ASR", "AI4Bharat IndicWhisper", "Kannada/Kanglish speech."],
    ["Avatar", "SadTalker / LivePortrait / Wav2Lip", "OSS lip-sync."],
    ["Animation", "Manim, Remotion, Lottie", "Programmatic, scalable."],
    ["Live streaming", "LiveKit OSS", "WebRTC SFU + HLS egress."],
    ["VOD storage", "MinIO / DO Spaces", "S3-compatible, low cost."],
    ["CDN", "BunnyCDN (BLR/BOM/MAA)", "~₹0.4/GB egress."],
    ["Primary DB", "PostgreSQL 16 + pgvector", "Transactional + vector."],
    ["Cache/Queue", "Redis 7 + BullMQ", "Sessions, jobs, rate limit."],
    ["Event bus", "Redpanda or NATS JetStream", "Decouple services."],
    ["Notifications", "MSG91 + Gupshup + SES", "India-priced."],
    ["Payments", "Razorpay + Cashfree", "Best UPI coverage."],
    ["Hosting (apps)", "E2E / Hetzner / DO Bengaluru", "30-60% cheaper than AWS."],
    ["Hosting (GPU)", "E2E GPU + Lambda Labs spot", "₹45-90/hr vs AWS ₹300+/hr."],
    ["Orchestration", "Kubernetes (k3s) bare-metal", "OSS, no premium."],
    ["Observability", "Prometheus + Grafana + Loki + Sentry", "OSS stack."],
    ["CI/CD", "GitHub Actions + ArgoCD", "Free for small org."],
], col_widths=[3.5 * cm, 6 * cm, 7 * cm]))

story.append(PageBreak())

# 4. MODULES
story.append(Paragraph("4. Core Modules &amp; Microservices", h1))
modules = [
    ("4.1 Identity &amp; Auth Service",
     "Manages students, parents, admins. JWT auth, OTP via SMS for student onboarding. Parents linked "
     "via one-time parent-link code. Roles: student, parent, content_editor, operator, admin."),
    ("4.2 Curriculum Service",
     "Source of truth for the Karnataka syllabus tree (Board &rarr; Grade &rarr; Subject &rarr; "
     "Chapter &rarr; Topic). KSEEB/PUE PDFs ingested via OCR + LLM extraction."),
    ("4.3 Lesson Service",
     "A Lesson is the canonical reusable unit: script (EN + Kanglish), animation timeline, slides, "
     "avatar video, captions, transcript, prereqs, difficulty. Cached forever."),
    ("4.4 Scheduling Service",
     "Plans 7-8 PM daily slot. Default weekly grid: Mon=Maths, Tue=Science, Wed=Social, "
     "Thu=English, Fri=Kannada, Sat=Weekly Test, Sun=Doubt &amp; Revision."),
    ("4.5 Live Class Service",
     "Pre-flight at T-5m, LiveKit room at T-1m, streams pre-rendered video + live Q&amp;A overlay, "
     "egress to MinIO at T+60m."),
    ("4.6 Attendance Service",
     "Heartbeats every 30s. watched_pct = sum/duration. present (&ge;80%), partial (50-80%), "
     "absent (&lt;50%). Publishes attendance.recorded to Kafka."),
    ("4.7 Notification Service",
     "Channel priority: WhatsApp &rarr; SMS &rarr; Email (Gupshup/MSG91/SES). Quiet-hours and "
     "language preference honoured."),
    ("4.8 Assessment Service",
     "Weekly test: 30 Qs per subject (15 MCQ + 10 fill-blank + 5 short-answer). Timed player. "
     "Auto-graded (MCQ instant, subjective via LLM rubric)."),
    ("4.9 Reporting Service",
     "Sunday 9 AM weekly digest: attendance, test scores, mastery, recommendations."),
    ("4.10 Payment &amp; Subscription Service",
     "Razorpay subscriptions. Monthly/quarterly/yearly. Family pack. Free 7-day trial. UPI autopay."),
    ("4.11 Analytics &amp; Engagement",
     "Lesson views, drop-off, doubt topics. Powers content quality dashboard."),
    ("4.12 Admin / Operator Console",
     "Internal Next.js app: curriculum edits, AI lesson preview &amp; approval, support."),
]
for title, txt in modules:
    story.append(Paragraph(title, h2))
    story.append(Paragraph(txt, body))

story.append(PageBreak())

# 5. AI PIPELINE
story.append(Paragraph("5. AI Teacher Pipeline (Deep Dive)", h1))
story.append(Paragraph(
    "The 8-stage pipeline that turns a curriculum topic into a fully animated, narrated, bilingual "
    "class delivered by an AI persona.", body))
story.append(make_table([
    ["Stage", "Input", "Process", "Output"],
    ["1. Curriculum Ingest", "KSEEB PDF", "OCR + LLM extraction", "Curriculum JSON"],
    ["2. Lesson Plan", "Topic + objectives", "LLM \"explain-like-5\" rubric", "Script + outline"],
    ["3. Bilingual Adapt", "EN script", "LLM Kanglish + Kannada captions", "Kanglish + KN captions"],
    ["4. Scene Generation", "Segments", "Manim / Remotion / SVG", "MP4 clips"],
    ["5. Voice Synthesis", "Scripts", "IndicTTS + Coqui + SSML", "WAV per language"],
    ["6. Avatar Render", "Portrait + audio", "SadTalker / LivePortrait", "Talking-head clips"],
    ["7. Compose &amp; Caption", "Scene + audio + avatar", "ffmpeg + force-aligned captions",
     "HLS MP4 + VTT"],
    ["8. QA &amp; Publish", "Final lesson", "Auto-checks + editor review", "Published lesson"],
], col_widths=[3 * cm, 3.2 * cm, 6 * cm, 4.3 * cm]))

story.append(Paragraph("5.1 AI Teacher Personas", h2))
story.append(make_table([
    ["Persona", "Subject", "Style", "Voice"],
    ["Akka Anu", "Mathematics", "Warm, playful, Bengaluru analogies", "Female, Kanglish + EN"],
    ["Anna Kiran", "Physics + Chemistry", "Curious, experiment-driven", "Male, Kanglish + EN"],
    ["Ms. Priya", "Biology", "Story-led, visual", "Female, EN-primary"],
    ["Sir Vikram", "Social Studies", "Narrative, storytelling", "Male, Kanglish + EN"],
    ["Teacher Maya", "English", "Conversational, drama-based", "Female, EN-primary"],
    ["Guru Hari", "Kannada / 2nd-Lang", "Literary, poetic", "Male, Pure Kannada"],
], col_widths=[3 * cm, 4 * cm, 6 * cm, 3.5 * cm]))

story.append(Paragraph("5.2 Live Class Runtime", h2))
story.append(bullets([
    "<b>Main video</b>: HLS playlist of pre-rendered avatar + animation segments.",
    "<b>Live chat</b>: Students post doubts in EN/Kanglish (text or voice via ASR).",
    "<b>Doubt classifier</b>: Lightweight LLM groups doubts; top-3 picked every 10 min.",
    "<b>Live Q&amp;A</b>: 8B LLM answers via RAG; TTS + avatar clip streamed live.",
    "<b>Polls</b>: Every 10 min, feeding back to attendance scoring.",
]))

story.append(PageBreak())

# 6. DATA MODEL
story.append(Paragraph("6. Data Model (Core Entities)", h1))
story.append(make_table([
    ["Entity", "Key Fields", "Notes"],
    ["User", "id, phone, email, role, language_pref", "Base for all user types."],
    ["Student", "user_id, name, grade, board, school, parent_id", "Linked via parent-link code."],
    ["Parent", "user_id, whatsapp_no, notif_pref, students[]", "Multiple students per parent."],
    ["Subject", "id, name, grade, code", "Karnataka subjects only at v1."],
    ["Chapter", "id, subject_id, order, title_en, title_kn", "KSEEB textbook."],
    ["Topic", "id, chapter_id, order, learning_objectives[]", "Smallest curriculum unit."],
    ["Lesson", "id, topic_id, persona_id, lang, script_en, script_kg, video_url",
     "Reusable; cached."],
    ["AITeacherPersona", "id, name, subject, voice_id, avatar_id, prompt", "See 5.1."],
    ["LiveClass", "id, lesson_id, scheduled_at, room_id, status, recording_url", "Per slot."],
    ["Enrollment", "id, student_id, plan, dates", "Subscription record."],
    ["Attendance", "id, student_id, live_class_id, watched_pct, status", "Heartbeat-derived."],
    ["Test", "id, week_no, subject_id, questions[], duration", "Generated weekly."],
    ["TestAttempt", "id, student_id, test_id, answers, score", "Auto-graded."],
    ["Notification", "id, user_id, channel, template, status", "Idempotent."],
    ["ParentReport", "id, parent_id, period, json", "Weekly digest."],
    ["Subscription", "id, student_id, plan, gateway_sub_id, status", "Razorpay."],
    ["Payment", "id, subscription_id, gateway_txn, amount, status", "UPI/card."],
], col_widths=[3.5 * cm, 6.8 * cm, 6.2 * cm]))

# 7. API
story.append(Paragraph("7. Public API Surface (selected endpoints)", h1))
story.append(make_table([
    ["Method &amp; Path", "Purpose"],
    ["POST /auth/otp/send", "Send OTP to phone."],
    ["POST /auth/otp/verify", "Verify OTP, issue JWT."],
    ["GET /me/today", "Today's class + catch-up suggestions."],
    ["GET /classes/:id/join", "LiveKit token + room."],
    ["POST /classes/:id/heartbeat", "Player ping every 30s."],
    ["POST /classes/:id/doubt", "Submit doubt to live Q&amp;A queue."],
    ["GET /lessons/:id", "Lesson VOD (signed HLS URL)."],
    ["GET /tests/:id", "Start timed test."],
    ["POST /tests/:id/submit", "Submit answers; auto-grade."],
    ["GET /parent/students/:id/report", "Latest weekly parent report."],
    ["POST /webhooks/razorpay", "Subscription/payment events."],
    ["POST /webhooks/gupshup", "WhatsApp delivery receipts."],
], col_widths=[7 * cm, 9.5 * cm]))

story.append(PageBreak())

# 8. LIFECYCLE
story.append(Paragraph("8. Live Class Lifecycle (7 PM - 8 PM)", h1))
story.append(make_table([
    ["Time", "Event", "System Action"],
    ["T-24h", "Topic picked", "Scheduler assigns Lesson + Persona."],
    ["T-12h", "Lesson pre-rendered", "AI pipeline runs if new."],
    ["T-2h", "Reminders go out", "WhatsApp/SMS \"Class at 7 PM\"."],
    ["T-15m", "Asset warm-up", "Pre-warm CDN; spin up LiveKit; load Q&amp;A LLM."],
    ["T-1m", "Doors open", "Students join; HLS buffer; heartbeat starts."],
    ["T+0", "Class begins", "Main HLS starts; chat opens; polls scheduled."],
    ["T+0 to T+45m", "Lesson delivery", "Pre-rendered segments + polls."],
    ["T+45m to T+60m", "Live Q&amp;A", "Top doubts; 8B LLM + TTS + avatar."],
    ["T+60m", "Class ends", "Egress to MinIO; auto-publish VOD."],
    ["T+62m", "Attendance computed", "Heartbeats aggregated."],
    ["T+65m", "Parent alerts fire", "Absent students &rarr; WhatsApp parent."],
    ["T+90m", "ASR &amp; index", "IndicWhisper transcribes; searchable."],
], col_widths=[2.5 * cm, 4 * cm, 10 * cm]))

# 9. ATTENDANCE
story.append(Paragraph("9. Attendance &amp; Parent Reporting", h1))
story.append(make_table([
    ["Status", "Watched %", "Parent Alert?"],
    ["Present", "&ge; 80%", "No (weekly digest only)"],
    ["Partial", "50% - 80%", "Soft nudge"],
    ["Absent", "&lt; 50%", "Immediate WhatsApp + SMS within 5 min"],
], col_widths=[3 * cm, 3 * cm, 10.5 * cm]))
story.append(Paragraph("Notification rules", h2))
story.append(bullets([
    "<b>Quiet hours</b>: never 10 PM - 7 AM; queue for morning.",
    "<b>Channel</b>: WhatsApp &rarr; SMS &rarr; Email.",
    "<b>Language</b>: parent's preference.",
    "<b>Cap</b>: 1 missed-class alert per child per day.",
    "<b>Weekly digest</b>: Sunday 9 AM.",
]))
story.append(Paragraph(
    "<i>Sample WhatsApp template: \"Namaste {{parent_name}}, {{student_name}} did not attend "
    "today's {{subject}} class on Ananta (7-8 PM). The recording is available - tap here: "
    "{{vod_link}}. - Team Ananta\"</i>", quote))

story.append(PageBreak())

# 10. TESTS
story.append(Paragraph("10. Weekly Test System", h1))
story.append(make_table([
    ["Step", "When", "Detail"],
    ["1. Topic basket", "Sat 8 AM", "Pull 5 lessons Mon-Fri per subject."],
    ["2. Question gen", "Sat 10 AM", "LLM: 15 MCQ + 10 fill + 5 short-answer."],
    ["3. Quality review", "Sat noon", "Editor reviews flagged Qs."],
    ["4. Test sit", "Sat 7-8 PM", "Timed; tab-lock; one-attempt."],
    ["5. Auto-grade", "Sat 8:05 PM", "MCQ instant; subjective via rubric."],
    ["6. Feedback", "Sat 8:30 PM", "Per-topic mastery + recommendations."],
    ["7. Parent share", "Sat 9 PM", "WhatsApp score + link."],
], col_widths=[3.2 * cm, 2.5 * cm, 11 * cm]))
story.append(Paragraph("Anti-cheating", h2))
story.append(bullets([
    "Question randomization per student.",
    "Tab-switch detection; 3 switches = auto-submit.",
    "Single-device lock for test duration.",
    "Optional webcam proctoring (opt-in) for mock exams.",
]))

# 11. BILINGUAL
story.append(Paragraph("11. Bilingual &amp; Kanglish Support", h1))
story.append(bullets([
    "Scripts authored in English then auto-adapted to Kanglish.",
    "TTS via AI4Bharat Indic-Parler-TTS (code-mix native).",
    "Two caption tracks: English + Kanglish.",
    "Doubt search accepts Kanglish input.",
    "Pure-Kannada fallback for 2nd-language subject and rural users.",
]))

# 12. SECURITY
story.append(Paragraph("12. Security, Privacy &amp; Compliance", h1))
story.append(bullets([
    "<b>DPDP Act 2023</b> compliance; verifiable parental consent for minors.",
    "<b>Minimal PII</b>: phone + name + grade + parent only.",
    "<b>Encryption</b>: TLS 1.3 in transit; AES-256 at rest.",
    "<b>Secrets</b>: Vault (OSS) or KMS.",
    "<b>RBAC + audit log</b>: immutable.",
    "<b>WAF + rate-limit</b>: Cloudflare + Redis.",
    "<b>Content moderation</b>: profanity/harm classifier on doubt chat.",
    "<b>Backups</b>: WAL shipping + daily snapshots; restore tested monthly.",
]))

story.append(PageBreak())

# 13. COST
story.append(Paragraph("13. Scaling &amp; Cost Model", h1))
story.append(Paragraph("Indicative monthly infra cost at 5,000 active students", h2))
story.append(make_table([
    ["Item", "Spec", "₹/month"],
    ["App servers (k3s, 4 nodes)", "E2E 8vCPU/16GB × 4", "₹16,000"],
    ["GPU - live Q&amp;A", "1 × A10 24GB", "₹32,000"],
    ["GPU - batch render (spot)", "A100 × 100h", "₹20,000"],
    ["Postgres (managed)", "8vCPU/32GB + replica", "₹12,000"],
    ["Redis", "4GB cluster", "₹3,500"],
    ["MinIO storage", "5 TB", "₹4,500"],
    ["BunnyCDN egress", "30 TB @ ₹0.4/GB", "₹12,000"],
    ["LiveKit (self-host)", "SFU + egress", "₹6,000"],
    ["MSG91 + Gupshup", "~150k messages", "₹15,000"],
    ["Monitoring + misc", "Loki / Sentry", "₹4,000"],
    ["Total (excl. payment fees)", "", "~₹1.25 L"],
    ["Per active student / month", "", "~₹25"],
], col_widths=[6 * cm, 5.5 * cm, 4.5 * cm]))

# 14. ROADMAP
story.append(Paragraph("14. Phased Build Roadmap", h1))
story.append(make_table([
    ["Phase", "Months", "Scope", "Goal"],
    ["P0 Foundations", "M1-M2", "Identity, CMS, Lesson player, CI/CD",
     "Internal demo, 1 lesson"],
    ["P1 First Subject Live", "M3-M4", "AI pipeline E2E (Math G10), LiveKit, attendance, WhatsApp",
     "Closed beta 50 students"],
    ["P2 Full Grade 10", "M5-M6", "All G10 subjects, tests, payments, parent app",
     "1,000 paying students"],
    ["P3 Grades 11 &amp; 12", "M7-M9", "PU curriculum, mobile app", "10,000 students"],
    ["P4 Scale", "M10-M12", "Adaptive learning, 1:1 AI doubt, multi-region",
     "50,000+ students"],
], col_widths=[3.2 * cm, 1.8 * cm, 7.5 * cm, 4 * cm]))

# 15. TEAM
story.append(Paragraph("15. Recommended Team", h1))
story.append(make_table([
    ["Role", "Count", "Joining", "Notes"],
    ["Founder / PM", "1", "M1", "Product + curriculum"],
    ["Tech lead / Full-stack", "1", "M1", "Next.js + Node + DevOps"],
    ["AI/ML engineer", "1-2", "M1", "LLM, TTS, pipelines"],
    ["Backend engineer", "1", "M3", "APIs, payments"],
    ["Frontend engineer", "1", "M3", "Student + parent apps"],
    ["Curriculum lead", "1", "M2", "KSEEB expert"],
    ["Content editors", "2-3", "M3", "Lesson + test review"],
    ["Designer / Animator", "1", "M3", "Personas, Lottie"],
    ["Customer support", "1", "M5", "WhatsApp-first"],
], col_widths=[4 * cm, 1.5 * cm, 2.5 * cm, 8 * cm]))

# 16. RISKS
story.append(Paragraph("16. Risks &amp; Mitigations", h1))
story.append(make_table([
    ["Risk", "Likelihood", "Impact", "Mitigation"],
    ["AI hallucinations", "High", "Critical", "RAG + mandatory editor approval."],
    ["Kanglish TTS quality", "Medium", "High", "Curated samples + fallback."],
    ["Trust vs human-brand", "High", "High", "Free trials, exam pass-rate proof."],
    ["DPDP compliance", "Medium", "Critical", "Parental consent flow + audits."],
    ["Bandwidth tier-2/3 KA", "High", "Medium", "Adaptive HLS + downloads."],
    ["GPU cost spikes", "Medium", "Medium", "Quantized models + batching."],
    ["Recording piracy", "Medium", "Low", "Signed URLs + watermarking."],
], col_widths=[4 * cm, 2 * cm, 2 * cm, 8 * cm]))

story.append(Spacer(1, 0.5 * cm))
story.append(HRFlowable(width="100%", thickness=0.6, color=GREY_BORDER))
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph(
    "<b>End of Architecture Document v1.0</b><br/>Prepared for Ananta (priyanka).", small))


def first_page(canv, doc):
    cover_canvas(canv, doc)


def later_pages(canv, doc):
    page_canvas(canv, doc)


doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(f"PDF written: {OUTPUT}")
