# Upload lesson videos

Videos are uploaded one lesson at a time into the academy’s existing courses. The current studio does not create new course catalog entries or import an entire course folder.

The current website address is **https://yo-app-academy.vercel.app**, served directly by **Vercel** with the existing **Convex production database and file storage**. The owner deleted the Netlify project. The deployed Vercel build and approved private runtime configuration passed public API, existing administrator login, studio/enrollment-list and logout checks. [Hosted browser evidence](qa/vercel-public-browser.json). Earlier development-cloud and Netlify results do not verify uploads on the new host; the first real production recording remains an owner upload through the studio.

## Sign in as a mentor

Open **Log in** and sign in with your mentor or administrator account. For first-time mentor registration, choose **Create account**, select **Mentor**, and enter the private mentor invitation code. The academy administrator configures that code as `YOH_MENTOR_INVITE`; do not publish it or share it with students. In local development it is configured in `.env.local`. Hosted registration uses the matching invitation configured in the app runtime and Convex deployment.

Student accounts cannot upload videos. An existing student account needs an administrator to change its role; registering again with the same email will not promote it.

## Create and publish a lesson

1. Open **Mentor studio** and choose **New lesson**.
2. Enter the lesson title, select its **Course**, and describe what students will build.
3. Optionally add chapters, one per line, such as `00:00 Introduction` and `02:30 Build the screen`.
4. Click **Save lesson draft**.
5. Choose a video and wait until the upload finishes. You can cancel an upload while it is running. Keep the page open during the upload.
6. Optionally attach PDF notes or a ZIP of the project files.
7. Use **Preview lesson**, then **Publish lesson**. You can edit or unpublish it later from **Your lessons**.

## Accepted files

| File | Supported formats | App limit per file |
| --- | --- | --- |
| Lesson video | MP4 or WebM | 250 MB |
| Lesson resource | PDF or ZIP | 25 MB |

Up to 20 resource files can be attached to one lesson. A normal browser-compatible MP4 is a useful choice for playback across devices. Split long recordings into separate lessons when necessary.

With Convex configured, file bytes upload directly to Convex storage and survive Vercel redeployments. Uploading and publishing a lesson does not require rebuilding the website. The current uploader does not resume an interrupted transfer; choose the file again after a failure. Convex’s upload request has a two-minute timeout, and the Free plan has storage/bandwidth limits. [Convex upload documentation](https://docs.convex.dev/file-storage/upload-files), [Convex usage limits](https://docs.convex.dev/production/state/limits).

Without a Convex URL, the local preview stores accounts and uploads on this computer. Local uploads are not automatically copied to a future Convex deployment.

Website updates use the [Vercel deployment workflow](VERCEL_DEPLOYMENT.md). Vercel builds the Next.js app and needs the existing production Convex URL plus matching private runtime bridge/invitation values. Backend changes deploy separately through the authenticated local Convex CLI. No Convex deploy key or account token is required or granted to Vercel. Existing accounts and uploaded files stay in Convex when the frontend is redeployed.

## Approve students

Students create an account, open **My learning**, and click **Request enrollment**. Their lessons remain locked while the request is pending.

Sign in with an **administrator** account and open the studio’s **Student enrollment** section. Click **Approve student** to unlock the program’s published lessons for that student, or **Revoke access** to remove their access through the app. Students can use **Refresh enrollment status** after you approve them. A mentor account can upload lessons but cannot approve students; the administrator role is provisioned privately with `pnpm setup-admin` against the intended backend.

Approval currently covers the whole mentorship program. It does not collect money or verify payment, and it does not assign semesters to lessons. The public interactive sample remains free.

Convex storage URLs already received by an approved learner remain reusable if copied. Revocation prevents the app from releasing fresh URLs; it does not invalidate a previously disclosed storage URL or prevent screen recording. Keep that limitation in mind when choosing recordings for this launch.
