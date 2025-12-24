# Taillog

A lightweight Chrome extension for web developers to monitor console logs, network requests, and manage clipboard history.

## Features

### Console Tab
- Real-time monitoring of `console.log`, `error`, `warn`, `info` messages
- Filter logs by type
- Auto-formatted JSON for better readability

### Network Tab
- Monitor `fetch` and `XMLHttpRequest` calls in real-time
- Filter by HTTP methods (GET, POST, PUT, DELETE)
- Search requests by URL
- One-click copy for Payload and Response data

### Stash Tab
- Automatically captures copied text
- View clipboard history at a glance
- Re-copy with a single click

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Clone this repository
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

4. Load in Chrome
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Privacy

Taillog respects your privacy:
- All data is stored locally on your device
- No data is transmitted to external servers
- No personal information is collected

See [Privacy Policy](PRIVACY_POLICY_EN.md) for more details.

See [개인정보처리방침](PRIVACY_POLICY_KO.md) for more details.

## License

MIT License

## Contact

- Email: hbd9425@gmail.com
- GitHub: https://github.com/justart-dev/react-devtools-extension
