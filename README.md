# Local Chatbot

Chatbot sử dụng LLM local thông qua Ollama với giao diện React.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama đã cài đặt và chạy (http://localhost:11434)

### Installation
```bash
# Install dependencies
npm run install:all

# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development
npm run dev
```

## 📁 Structure

```
Project-00/
├── client/          # React frontend
├── server/          # Node.js/Express backend
├── docs/            # Documentation
├── package.json     # Root package.json
└── README.md
```

## 🛠️ Tech Stack

**Client:**
- React 18
- Tailwind CSS
- Axios
- React Markdown

**Server:**
- Node.js
- Express
- Ollama Integration
- Rate Limiting & Security

## 📖 Documentation

- [Project Rules](docs/PROJECT_RULES.md)

## 🤝 Contributing

Xem [Project Rules](docs/PROJECT_RULES.md) để biết coding conventions.

## 📝 License

MIT
