# Taillog - Console & Network Logger

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nomgkaaaojblgcgkmiepaaggbfpeeobm)](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Chrome extension for web developers to monitor console logs, network requests, and manage clipboard history. Debug faster without opening DevTools!

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm)**

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

### Locator (React Component Inspector)
- **Alt + Hover**: Highlight React components and see component name with source location
- **Alt + Click**: Open the component source file directly in your IDE
- Supported IDEs: VSCode, Cursor, Windsurf, IntelliJ IDEA, Antigravity

## Notice: Component Locator Requirements

The **Locator** feature requires `_debugSource` information embedded in React components. This is only available in **development builds** with proper configuration.

### Works Out of the Box
| Framework | Condition |
|-----------|-----------|
| **Create React App** | Development mode (`npm start`) |
| **Next.js** | Development mode (`npm run dev`) |
| **Remix** | Development mode |

### Requires Additional Configuration

#### Vite + React

Vite does not include `_debugSource` by default. Add the Babel plugin:

1. Install the plugin:
   ```bash
   npm install -D @babel/plugin-transform-react-jsx-source
   ```

2. Update `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [
       react({
         babel: {
           plugins: ['@babel/plugin-transform-react-jsx-source']
         }
       })
     ]
   })
   ```

3. Restart the dev server

#### Custom Webpack Setup

Add the Babel plugin to your `.babelrc` or `babel.config.js`:
```json
{
  "plugins": ["@babel/plugin-transform-react-jsx-source"]
}
```

### Does Not Work
- **Production builds** - Source information is stripped for optimization
- **Minified code** - Component names are mangled
- **Server Components (RSC)** - No client-side fiber information available

### Indicator Colors
| Color | Meaning |
|-------|---------|
| Blue | Source available - click to open in IDE |
| Orange | No source info - component name will be copied |
| Gray | No React component detected |

## Installation

### From Chrome Web Store (Recommended)
**[Click here to install Taillog](https://chromewebstore.google.com/detail/taillog-console-network-l/nomgkaaaojblgcgkmiepaaggbfpeeobm)**

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
Email: hbd9425@gmail.com

