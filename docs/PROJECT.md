# mindSwipe — project description

> Learn while you scroll.

## The idea

We spend a lot of time scrolling short-form feeds. Social platforms have trained
us to focus on — and keep coming back to — bite-sized content. mindSwipe turns
that same habit toward learning: a feed of flashcards you swipe through the way
you'd swipe a short-video app, during the small gaps in a day (commute, queue,
toilet break).

The bet is twofold:

1. **Format.** Study material presented as a fast, swipeable feed fits the
   attention pattern people already have, so it gets consumed where a textbook or
   a quiz app wouldn't.
2. **Platform.** Because the format is native to how social feeds work, the same
   material can later live *as* social content — posts in a channel people follow
   — giving learning material a real shot at distribution.

## Audience

People studying toward a concrete goal who have idle scroll-time to reclaim:

- Certification candidates (e.g. Oracle Java OCP, cloud certs)
- Licence/theory exams (e.g. driving theory)
- High-school / secondary exam subjects (maths, biology, chemistry, physics, …)
- Casual general-knowledge learners

## Content

Cards are authored and reviewed by us (today: by agents, reviewed before they
enter the backend). A card is one focused idea:

- A **multiple-choice question** graded on the spot, or
- A short **reading** card (a concept explained in a few lines).

Cards mix formats deliberately — some plain text, some styled as an "image"
built from HTML/CSS — so the feed doesn't feel monotonous. Tapping a card opens
the full solution: the answer, tips, open questions, and links to related cards.

## Product principles

- **Feels native to scrolling.** One card at a time, snap feed, swipe to move —
  the interaction people already have muscle memory for.
- **Smooth and battery-cheap.** The main context is a phone on mobile data or no
  data at all. Only a few cards are ever rendered; payloads are small text.
- **Works offline.** You can save a study session and run with no connection.
- **View-first, write-ready.** Phase 1 is consumption only, but the data model
  and API are shaped so accounts, progress, and user comments are additive — not
  a rewrite.

## Phases

### Phase 1 — the scrollable feed (current)

A website (installable as a PWA) that mimics a short-video / Twitter feed for
view-only flashcards. Simple backend, no video, no accounts. Prove the core
experience: swipe, answer, open details, go offline.

**Status: working prototype.** See [ROADMAP.md](ROADMAP.md) for what's done and
what's left in this phase.

### Phase 2 — personalise and scale the content

Turn a feed into a study tool and a content operation:

- Accounts; sync likes / saves / answered-state across devices.
- Progress tracking and spaced-repetition scheduling (show weak cards sooner).
- A real authoring + multi-agent review pipeline that generates, checks, and
  ingests content into the backend at volume.
- Search and browse by topic / difficulty / tag; analytics on which cards work.

### Phase 3 — the content channel / social layer

Deliver the original vision: mindSwipe as a place content lives, not just a
viewer.

- Video and image posts as flashcards, with a media pipeline (object storage +
  CDN).
- Comment sections opened up (with moderation); following, channels,
  notifications.
- Creator tooling so material from others can enter the platform.
- Infrastructure to match (distributed database, caching, rate limiting).

## Success signals

- **Phase 1:** the feed feels as smooth as a native short-video app; a session
  can be taken fully offline; people finish more cards per sitting than a
  conventional quiz app would get.
- **Phase 2:** returning users; measurable learning (cards answered correctly on
  second exposure); content throughput high enough to keep feeds fresh.
- **Phase 3:** content gets distribution as posts; creators and followers show up.

## See also

- [TECH.md](TECH.md) — architecture, data model, API, and scaling path.
- [ROADMAP.md](ROADMAP.md) — phased todo with current status.
