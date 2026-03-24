# Contributing to MediScript AI

Thanks for your interest in contributing to MediScript AI.

MediScript AI is an open-source clinical documentation blueprint built with a Next.js App Router frontend, serverless API routes, and a two-stage AI pipeline using OpenAI Whisper for speech-to-text transcription and GPT-4o for contextual speaker diarization, SOAP note generation, and medical billing code extraction. We welcome improvements across the codebase, documentation, bug reports, design feedback, and workflow polish.

Before you start, read the relevant section below. It helps keep contributions focused, reviewable, and aligned with the current project setup.

---

## Quick Setup Checklist

Before you dive in, make sure you have these installed:

```bash
# Check Node.js (18+ recommended)
node --version

# Check npm
npm --version

# Check Docker
docker --version

# Check Git
git --version
```

New to contributing?

1. Open an issue or pick an existing one to work on.
2. Fork the repo and create a branch from `main`.
3. Follow the local setup guide below.
4. Run the app locally and verify your change before opening a PR.

---

## Table of Contents

- [How do I...?](#how-do-i)
  - [Get help or ask a question?](#get-help-or-ask-a-question)
  - [Report a bug?](#report-a-bug)
  - [Suggest a new feature?](#suggest-a-new-feature)
  - [Fork and clone the repo?](#fork-and-clone-the-repo)
  - [Set up MediScript AI locally?](#set-up-mediscript-ai-locally)
  - [Start contributing code?](#start-contributing-code)
  - [Improve the documentation?](#improve-the-documentation)
  - [Submit a pull request?](#submit-a-pull-request)
- [Branching model](#branching-model)
- [Commit conventions](#commit-conventions)
- [Code guidelines](#code-guidelines)
- [Pull request checklist](#pull-request-checklist)
- [Thank you](#thank-you)

---

## How do I...

### Get help or ask a question?

- Start with the main project docs in [`README.md`](./README.md).
- If something is unclear, open a GitHub issue with your question and the context you already checked.

### Report a bug?

1. Search existing issues first.
2. If the bug is new, open a GitHub issue.
3. Include your environment, what happened, what you expected, and exact steps to reproduce.
4. Add screenshots, browser console logs, or API error responses if relevant.

### Suggest a new feature?

1. Open a GitHub issue describing the feature.
2. Explain the problem, who it helps, and how it fits MediScript AI.
3. If the change is large, get alignment in the issue before writing code.

### Fork and clone the repo?

All contributions should come from a **fork** of the repository. This keeps the upstream repo clean and lets maintainers review changes via pull requests.

#### Step 1: Fork the repository

Click the **Fork** button at the top-right of the [MediScript AI repo](https://github.com/cld2labs/MediScriptAI) to create a copy under your GitHub account.

#### Step 2: Clone your fork

```bash
git clone https://github.com/<your-username>/MediScriptAI.git
cd MediScriptAI
```

#### Step 3: Add the upstream remote

```bash
git remote add upstream https://github.com/cld2labs/MediScriptAI.git
```

This lets you pull in the latest changes from the original repo.

#### Step 4: Create a branch

Always branch off `main`. See [Branching model](#branching-model) for naming conventions.

```bash
git checkout main
git pull upstream main
git checkout -b <type>/<short-description>
```

---

### Set up MediScript AI locally?

#### Prerequisites

- Node.js 18+ and npm
- Git
- Docker (for containerized deployment testing)
- An OpenAI API key (used for both Whisper STT and GPT-4o)

#### Step 1: Install dependencies

```bash
npm install
```

#### Step 2: Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

> **Note:** MediScript AI uses only the OpenAI API. No other third-party AI service keys are required.

#### Step 3: Start the development server

```bash
npm run dev
```

The application runs at `http://localhost:3000`.

> **Important:** Always use the exact `http://localhost:3000` URL. Browser microphone access is blocked on non-HTTPS origins — `localhost` is the only exception. Using `127.0.0.1` or your machine's local IP address will silently block the microphone.

#### Step 4: Verify the application

Open `http://localhost:3000` in your browser. You should see the MediScript AI interface with the dark-mode UI, the compliance disclaimer banner, and the audio input panel.

To test without spending API credits, you can temporarily enable the mock backend by replacing the API logic in `app/api/process-audio/route.ts` with the hardcoded fixture response and a `setTimeout` of 3 seconds. This lets you verify all UI flows — loading states, keyword highlighting, SOAP note rendering, and export buttons — without making real OpenAI calls.

#### Option: Run with Docker

To test the production build locally:

```bash
# Build the image
docker build -t mediscript-ai .

# Run the container, injecting your API key at runtime
docker run -p 3000:3000 -e OPENAI_API_KEY="sk-your-openai-api-key-here" mediscript-ai
```

Open `http://localhost:3000`. If the UI loads and audio processing works, the container is production-ready.

#### Common troubleshooting

- If the microphone is blocked, confirm you are accessing the app via `http://localhost:3000` and not a local IP address.
- If audio processing returns a 500 error, open the browser console and confirm your `OPENAI_API_KEY` is set correctly in `.env.local` and that you restarted the dev server after saving the file.
- If the Docker build fails, confirm that `output: 'standalone'` is set in `next.config.ts` and rebuild with `docker build --no-cache -t mediscript-ai .`
- If ports `3000` are already in use, stop the conflicting process before starting MediScript AI.

---

### Start contributing code?

1. Open or choose an issue.
2. [Fork the repo](#fork-and-clone-the-repo) and create a feature branch from `main`.
3. Keep the change focused on a single problem.
4. Run the app locally and verify the affected workflow end-to-end (audio capture → transcription → SOAP notes → export).
5. Update docs when behavior, setup, environment variables, or architecture changes.
6. Open a pull request back to upstream `main`.

### Improve the documentation?

Documentation updates are welcome. Relevant files currently live in:

- [`README.md`](./README.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

### Submit a pull request?

1. Push your branch to your fork.
2. Go to the [MediScript AI repo](https://github.com/cld2labs/MediScriptAI) and click **Compare & pull request**.
3. Set the base branch to `main`.
4. Fill in the PR template describing what changed and why.
5. Submit the pull request.

A maintainer will review your PR. You may be asked to make changes — push additional commits to the same branch and they will be added to the PR automatically.

Before opening your PR, sync with upstream to avoid merge conflicts:

```bash
git fetch upstream
git rebase upstream/main
```

---

## Branching model

- Fork the repo and base new work from `main`.
- Open pull requests against upstream `main`.
- Use descriptive branch names with a type prefix:

| Prefix | Use |
|---|---|
| `feat/` | New features or enhancements |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring (no behavior change) |
| `chore/` | Dependency updates, CI changes, tooling |

Examples: `feat/pdf-export`, `fix/microphone-permissions`, `docs/update-setup-guide`, `refactor/soap-notes-component`

---

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <short description>
```

Examples:

```bash
git commit -m "feat(api): add ICD-10 code extraction to billing endpoint"
git commit -m "fix(ui): resolve keyword highlight overlap on long transcripts"
git commit -m "docs: add Docker troubleshooting steps to CONTRIBUTING"
git commit -m "chore: upgrade next to latest patch version"
```

Keep commits focused — one logical change per commit.

---

## Code guidelines

- Follow the existing project structure and patterns before introducing new abstractions.
- Keep frontend changes consistent with the Next.js App Router, Tailwind CSS, and shadcn/ui setup already in use.
- Keep backend changes consistent with the Next.js serverless API route structure under `app/api/`.
- The AI pipeline follows a strict two-step pattern: Whisper handles audio-to-text, GPT-4o handles all contextual reasoning (diarization, SOAP generation, billing codes). Preserve this separation.
- Do not introduce additional AI providers or third-party STT services without opening an issue and getting alignment first.
- Avoid unrelated refactors in the same pull request.
- Do not commit secrets, API keys, `.env.local` files, or generated audio artifacts.
- Prefer clear, small commits and descriptive pull request summaries.
- Update documentation when contributor setup, behavior, environment variables, or API usage changes.

---

## Pull request checklist

Before submitting your pull request, confirm the following:

- You tested the affected flow locally (including the full audio → transcript → SOAP notes → export path where relevant).
- The application still starts successfully in the environment you changed.
- You removed debug code, stray console logs, and commented-out experiments.
- You documented any new setup steps, environment variables, or behavior changes.
- You kept the pull request scoped to one issue or topic.
- You added screenshots for UI changes when relevant.
- You did not commit secrets, API keys, or local audio/generated data.
- You are opening the pull request against `main`.

If one or more of these are missing, the pull request may be sent back for changes before review.

---

## Important Note (Compliance)

MediScript AI is built for demonstration purposes only as part of the Cloud2 Labs Innovation Hub.

This demo is not a clinical documentation system and should not be used for medical decision-making.

Contributors should not introduce features that store, log, or persist any patient audio, transcripts, or personally identifiable information. The ephemeral, zero-storage architecture is a core non-functional requirement of this project.

---

## Thank you

Thanks for contributing to MediScript AI. Whether you are fixing a bug, improving the AI prompt engineering, refining the UI, or updating the docs, your work helps make the project more useful and easier to maintain.
