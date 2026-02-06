# Email generation

This folder contains **email templates only**. It is separate from the app (`src/`).

- **01-welcome-waitlist** – First mailer: welcome email for waitlist signups.

Use the HTML files as the body (or full document) for your transactional/welcome emails.

**Logo:** The template uses `<img src="...">` so the logo works on all mobile clients. Host `public/cardzzz.svg` at your domain (e.g. `https://cards.com/cardzzz.svg`) and set that URL in the template. Without a hosted URL the logo will not appear.

**Before sending:** Replace placeholders in the template:
- Logo `src` in the email – point to your hosted `cardzzz.svg` (e.g. `https://cards.com/cardzzz.svg`).
- `{{unsubscribe_url}}` – Your ESP’s one-click unsubscribe link (or equivalent merge tag).
- `https://instagram.com/cardzzz` – Your Instagram URL.
- `mailto:hello@cardzzz.com` – Your contact email.
- `https://cardzzz.com` – Your website (logo and footer link).
