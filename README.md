# Brand Discovery Studio

A guided client-discovery website that turns a brand workshop into a structured, Codex-ready website brief.

**Live site:** [brand-discovery-studio.josiewiddi.chatgpt.site](https://brand-discovery-studio.josiewiddi.chatgpt.site/)

## What it does

- Guides clients through a seven-stage brand and website discovery workshop
- Captures business goals, positioning, personality, references, visual direction, and experience requirements
- Uses dropdowns, multiple-choice cards, sliders, checkboxes, and long-form prompts
- Saves in-progress answers locally in the browser
- Generates a detailed Markdown implementation brief for Codex
- Copies the brief to the clipboard or downloads it as a `.md` file
- Emails completed submissions to the configured studio inbox through FormSubmit
- Supports mobile, tablet, and desktop layouts

## Project structure

```text
dist/
  index.html    Questionnaire markup and content
  styles.css    Responsive visual system
  app.js        Form state, validation, brief generation, and email submission
.openai/
  hosting.json  Sites deployment configuration
```

## Run locally

Serve the `dist` directory with any static file server. For example:

```bash
python3 -m http.server 4173 -d dist
```

Then open `http://localhost:4173`.

## Email activation

Email delivery uses FormSubmit. The first completed submission triggers an activation email for the configured destination address. Confirm that message once to enable delivery of the pending submission and all future briefs.

## Privacy

Draft answers are stored locally in the browser until the form is submitted or reset. Completed submissions are sent to FormSubmit for email delivery. Review FormSubmit's privacy and retention policies before collecting sensitive client information.
