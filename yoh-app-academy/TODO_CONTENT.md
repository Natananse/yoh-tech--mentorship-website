# Content needed before delivery

This file tracks missing owner content. The app does not represent sample content as real student results, approved mentor identities or published recordings.

| What is missing | Where it appears | What YO Tech LLC must supply |
| --- | --- | --- |
| Real recorded lesson videos | Hero preview, classroom and student library | MP4 or WebM recordings, including spoken instruction where intended. Upload through the mentor studio. The existing 48-second interactive sample is clearly labeled and is not a real recorded class. |
| Lesson resources | Classroom Resources tab | Approved PDF handouts and ZIP starter projects; upload through the mentor studio. |
| Approved course outlines and durations | Public course catalog and course dialogs | Final lesson titles, lesson counts, durations and availability. Current figures explicitly say planned. Published lesson metadata comes from the database. |
| Semester schedule and coverage | Mentorship package and course outlines | Supply each semester’s dates, duration and topic/course allocation. Package pricing is confirmed: two semesters at 3,000 ETB each, 6,000 ETB total. No online checkout is represented. |
| Additional mentor profiles | Editorial mentors section and course assignment labels | Yohanes Damtae’s name, portrait, JavaScript/React Native subjects, four years of coding experience and project biography are supplied. Provide approved photos, subjects, experience and teaching biographies for any additional mentors. Missing additional profiles remain marked as awaiting confirmation. |
| Student projects | Student-project masonry gallery | Approved screenshots, project names, first names, cities and permission to publish. Current concept images, “First name pending” and “City pending” are clearly marked placeholders. |
| Hosted launch | Vercel + Convex | Convex database/storage code is implemented. Vercel sign-in was verified, but public deployment is deferred at the owner’s request until hosting is ready. Confirm the intended Convex deployment, matching private environment values and suitable Vercel plan, then complete hosted upload/playback/download checks. A custom domain is optional. |
| Production mentor/admin access | Registration and administration | Choose the production mentor invitation and bootstrap an admin with your own name, email and password through `pnpm setup-admin`. A private development invitation exists locally; its value must remain outside documentation and source control. No public admin registration or default password is supplied. |
| Refund and enrollment terms | Course availability/help content | Approved terms before accepting payments or promising support. Payments are outside the requested flow. |

## Supplied and working

- Mentorship package: two semesters, 3,000 ETB per semester, 6,000 ETB total. Course cards no longer show separate proposed fees.

- Public company contact: `yohansforex@gmail.com`. Use it for `NEXT_PUBLIC_CONTACT_EMAIL` before building; the address is no longer missing content.
- Teacher: Yohanes Damtae. His supplied portrait, JavaScript and React Native subjects, four years of coding experience and project biography are displayed. Experience refers to coding, not years teaching. The biography includes Fresh Mate, an advertising ERP, work for BDU College of Science and a current school ERP collaboration; it does not claim college employment or credentials.
- Public phone: `0911701858`, linked as `tel:+251911701858` in the teacher section and footer. No WhatsApp service or availability is claimed.
- Account authentication, mentor uploads, student resume/completion, mentor analytics, private timestamped notes, lesson Q&A, certificate issuance, PDF downloads and public verification are implemented. They do not require invented sample activity.
- The database starts with no fabricated enrollments, completions or published lessons. Zero-valued public statistics are hidden. QA accounts and media are isolated under a temporary test data directory.

Vercel with Convex remains the selected launch target. The owner chose to keep the local preview until hosting is ready. Cloud deployment configuration and hosted end-to-end verification remain pending. See docs/VERCEL_DEPLOYMENT.md. Docker/Compose remains an alternative for a persistent Node host; it has not been executed here.
