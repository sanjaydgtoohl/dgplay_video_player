# Video Player App

This is a simple React 19 application that allows users to play videos using a custom video player component styled with Tailwind CSS.

## Features

- Full-screen playlist player with smooth crossfades between videos, images, and tags
- Auto-advance by media_duration, videos autoplay muted
- Live updates over WebSocket (optional)

## Getting Started

### Prerequisites

- Node.js (version 18 or later)
- Yarn (v1 or v4)

### Installation

```bash
yarn install
```

### Development

Create a `.env` (or `.env.local`) with optional WebSocket URL for live updates:

```
VITE_SOCKET_URL=wss://your-websocket-endpoint
```

Run the dev server:

```bash
yarn start
```

### Build & Preview

```bash
yarn build
yarn preview
```

### Notes

- Put assets in `public/` or use absolute URLs.
- Tailwind CSS v4 is used with `@tailwindcss/postcss`.

### License

This project is licensed under the MIT License.