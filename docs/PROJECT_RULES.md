# Project Rules & Guidelines

## Architecture
- **Client-Server Separation**: Giữ client và server hoàn toàn độc lập
- **RESTful API**: Server cung cấp API cho client
- **Stateless**: Server không lưu trạng thái, client quản lý state

## Code Conventions

### Naming
- **Files**: camelCase (e.g., `chatService.js`)
- **Components**: PascalCase (e.g., `ChatWindow.jsx`)
- **Functions**: camelCase (e.g., `sendMessage()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)

### File Organization
```
client/src/
  components/     # Reusable UI components
  pages/          # Page-level components
  hooks/          # Custom React hooks
  services/       # API calls
  utils/          # Helper functions
  styles/         # CSS/Tailwind
  context/        # React context

server/src/
  routes/         # API route definitions
  controllers/    # Request handlers
  services/       # Business logic
  middleware/     # Express middleware
  utils/          # Helper functions
  config/         # Configuration files
```

## Environment Variables
- **Client**: `.env` (REACT_APP_* prefix required)
- **Server**: `.env` (no prefix needed)
- **Never commit** .env files!

## API Design
- Base URL: `/api/v1`
- HTTP Methods: GET, POST, PUT, DELETE
- Response format: `{ success: boolean, data: any, error?: string }`
- Status codes: 200 (success), 400 (bad request), 500 (server error)

## Error Handling
- **Client**: Try-catch trong services, hiển thị lỗi UI-friendly
- **Server**: Centralized error handler middleware
- **Logging**: Dùng morgan cho HTTP logs

## Git Workflow
1. `main` branch luôn stable
2. Tạo feature branch: `feature/name`
3. Commit message: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore

## Performance
- Debounce input (300ms)
- Lazy load components
- Optimize images
- Minimize re-renders với React.memo

## Security
- CORS configured
- Rate limiting (100 req/15min)
- Input validation
- Helmet headers

## Documentation
- JSDoc cho functions phức tạp
- README cập nhật khi thay đổi
- Comments cho logic phức tạp

## Testing
- Unit tests cho utilities
- Integration tests cho API
- Component tests cho React
