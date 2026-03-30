# Taillog

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nomgkaaaojblgcgkmiepaaggbfpeeobm)](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Taillog is a Chrome extension for frontend debugging. It keeps console logs, network requests, clipboard history, and a React component locator in a lightweight popup UI, with a separate window mode when you need more space.

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm)**

## Highlights

- Clean popup UI focused on `Console` and `Network`
- English by default, with Korean support
- Language preference and last-opened tab persist across popup sessions
- Separate window mode with wider responsive layouts
- Local-first behavior with no external sync

## Features

### Console
- Monitor `console.log`, `info`, `warn`, and `error` events in real time
- Filter by level with a segmented control
- Expand entries only when you need the full payload

### Network
- Watch `fetch` and `XMLHttpRequest` traffic in real time
- Filter by HTTP method and search by URL or path
- Inspect payload and response data inline
- Copy payload or response content quickly

### Stash
- Save copied text automatically
- Re-copy recent snippets without leaving the page
- Keep the latest clipboard history close by while debugging

### Locator
- Inspect React components with `Alt/Option + Hover`
- Open source in your preferred editor when source metadata is available
- Store preferred editor and enabled state locally

## Localization

Taillog supports:

- English
- Korean

The selected language is stored locally and restored when the popup opens again.

## Separate Window Mode

Use the top-right expand button in the popup to open Taillog in a standalone window.

In standalone mode:

- the top app header stays fixed
- the window uses the full available width
- wider layouts are applied for `Network` details and `Locator`

## Installation

### From Chrome Web Store

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm).

### Manual Installation

1. Clone the repository

```bash
git clone https://github.com/justart-dev/react-devtools-extension.git
cd react-devtools-extension
```

2. Install dependencies

```bash
npm install
```

3. Build the extension

```bash
npm run build
```

4. Load the built extension
- Open `chrome://extensions/`
- Enable `Developer mode`
- Click `Load unpacked`
- Select the `dist` folder

## Development

```bash
npm install
npm run dev
npm run build
```

## Privacy

Taillog respects your privacy:

- All captured data stays on your device
- No data is transmitted to external servers
- No account is required

See [PRIVACY_POLICY_EN.md](PRIVACY_POLICY_EN.md) and [PRIVACY_POLICY_KO.md](PRIVACY_POLICY_KO.md) for details.

## License

MIT

## Contact

- Email: `hbd9425@gmail.com`
- Repository: `https://github.com/justart-dev/react-devtools-extension`
