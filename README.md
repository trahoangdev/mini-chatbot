# Local Chatbot

Chatbot sử dụng LLM local thông qua Ollama với giao diện React hiện đại, đẹp mắt.

## ✨ Features

- 🎨 **Modern UI/UX**: Glassmorphism design, dark/light mode, animations mượt mà
- 💬 **Chat Interface**: Message bubbles đẹp, markdown support, syntax highlighting
- 📝 **Code Blocks**: Hiển thị code với line numbers và copy button
- 🔄 **Conversation History**: Lưu và quản lý nhiều cuộc trò chuyện
- 🌙 **Dark Mode**: Tự động detect system preference
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị
- ⚡ **Real-time**: Auto-scroll, typing indicators, connection status

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama đã cài đặt và chạy (http://localhost:11434)

### Installation
```bash
# Clone repository
git clone https://github.com/trahoangdev/mini-chatbot.git

# Install dependencies
npm run install:all

# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development
npm run dev
```

Mở trình duyệt tại http://localhost:3000

## 📁 Structure

```
Project-00/
├── client/          # React frontend với modern UI
├── server/          # Node.js/Express backend
├── docs/            # Documentation
├── package.json     # Root package.json
└── README.md
```

## 🛠️ Tech Stack

**Client:**
- React 18
- Tailwind CSS với custom design tokens
- React Markdown + remark-gfm
- Prism Syntax Highlighter
- Modern glassmorphism UI design

**Server:**
- Node.js
- Express
- Ollama Integration
- Rate Limiting & Security

## 🎨 UI/UX Highlights

- **Glassmorphism Design**: Blur effects, transparency, modern aesthetics
- **Custom Color Palette**: Professional SaaS colors, WCAG compliant contrast
- **Smooth Animations**: Fade-in, slide, bounce effects
- **Code Highlighting**: Custom light/dark themes với line numbers
- **Message Bubbles**: Gradient backgrounds, shadow effects
- **Responsive Layout**: Sidebar, header, input area đều responsive

## 📖 Documentation

- [Project Rules](docs/PROJECT_RULES.md)

## 👤 Author

**trahoangdev**

- GitHub: [@trahoangdev](https://github.com/trahoangdev)

## 🤝 Contributing

Xem [Project Rules](docs/PROJECT_RULES.md) để biết coding conventions.

## 📝 License

MIT
