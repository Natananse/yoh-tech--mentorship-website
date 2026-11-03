# Content needed before delivery

This file tracks missing owner content. The app does not represent sample content as real student results, approved mentor identities or published recordings.

| What is missing | Where it appears | What YOH Tech LLC must supply |
| --- | --- | --- |
| Real recorded lesson videos | Hero preview, classroom and student library | MP4 or WebM recordings, including spoken instruction where intended. Upload through the mentor studio. The existing 48-second interactive sample is clearly labeled and is not a real recorded class. |
| Lesson resources | Classroom Resources tab | Approved PDF handouts and ZIP starter projects; upload through the mentor studio. |
| Approved course outlines and durations | Public course catalog and course dialogs | Final lesson titles, lesson counts, durations and availability. Current figures explicitly say planned. Published lesson metadata comes from the database. |
| Approved prices | Course card body | Confirmed ETB prices or instructions to remove pricing. Current prices say proposed. No checkout is represented. |
| Mentor profile content | Editorial mentors section and course assignment labels | Approved full names, professional portrait photos, role, subjects taught, years of experience and a short accurate teaching-style sentence. Registered mentor names and taught courses come from published lessons; missing portraits, experience and biography remain explicitly marked placeholders. |
| Student projects | Student-project masonry gallery | Approved screenshots, project names, first names, cities and permission to publish. Current concept images, “First name pending” and “City pending” are clearly marked placeholders. |
| Public deployment host | Preview/deployment | A Node24.13+ host with persistent writable storage for the database and uploaded files. Configure YOH_APP_URL and YOH_DATA_DIR. Static hosting cannot run authentication or uploads. |
| Production mentor/admin access | Registration and administration | Choose the production mentor invitation and bootstrap an admin with your own name, email and password through `pnpm setup-admin`. A private development invitation exists locally; its value must remain outside documentation and source control. No public admin registration or default password is supplied. |
| Refund and enrollment terms | Course availability/help content | Approved terms before accepting payments or promising support. Payments are outside the requested flow. |

## Supplied and working

- Public company contact: `yohansforex@gmail.com`. Use it for `NEXT_PUBLIC_CONTACT_EMAIL` before building; the address is no longer missing content.
- Account authentication, mentor uploads, student resume/completion, mentor analytics, private timestamped notes, lesson Q&A, certificate issuance, PDF downloads and public verification are implemented. They do not require invented sample activity.
- The database starts with no fabricated enrollments, completions or published lessons. Zero-valued public statistics are hidden. QA accounts and media are isolated under a temporary test data directory.

Docker/Compose configuration and Node deployment instructions are included. A public host, DNS, HTTPS and persistent production storage still need to be supplied; these files do not establish a completed deployment or a Docker execution test.
