# CortexNotes - AI-Powered Document Chat

A complete authentication system with Node.js, Express, MongoDB, and React frontend.

## Features

- **Authentication System**: JWT-based authentication with refresh tokens
- **User Management**: Registration, login, logout with secure password hashing
- **Query Limiting**: Track and limit user queries (default: 100 queries per user)
- **Document Processing**: Upload PDFs, text, and URLs for AI chat
- **Modern UI**: Smooth, responsive design with the same theme as NotebookLM

## Backend Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `backend` directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/cortexnotes

   # JWT Configuration
   JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_here_make_it_long_and_random_at_least_32_characters
   JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here_make_it_long_and_random_at_least_32_characters
   ```

3. **Start MongoDB** (if using local instance):
   ```bash
   mongod
   ```

4. **Start the backend server**:
   ```bash
   npm start
   ```

## Frontend Setup

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend**:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/protected` - Protected route example

### Document Processing
- `POST /api/pdfupload` - Upload PDF (requires auth)
- `POST /api/text` - Upload text content (requires auth)
- `POST /api/link` - Upload website URL (requires auth)

### Chat
- `POST /api/chat` - Send chat message (requires auth, checks query limit)

## Authentication Flow

1. **Registration**: User creates account with email/password
2. **Login**: User logs in and receives access token (15min) + refresh token (7 days)
3. **API Calls**: Frontend includes access token in Authorization header
4. **Token Refresh**: When access token expires, frontend uses refresh token to get new access token
5. **Query Limiting**: Each chat request increments user's query count, blocks when limit reached

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Stored in database with automatic expiration
- **Query Limiting**: Prevents abuse with per-user limits
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers middleware
- **Input Validation**: Email format and password length validation

## Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  queryCount: Number (default: 0),
  queryLimit: Number (default: 100),
  refreshTokens: Array,
  createdAt: Date
}
```

## Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: CSS transitions and keyframes
- **Theme Consistency**: Matches existing app design
- **Protected Routes**: Automatic redirect to login if not authenticated
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages

## Usage

1. **Register/Login**: Create account or sign in
2. **Upload Documents**: Add PDFs, text, or URLs as sources
3. **Chat**: Ask questions about uploaded documents
4. **Monitor Usage**: Track query count in header
5. **Logout**: Secure logout with token invalidation

## Development

### Backend Structure
```
backend/
├── models/
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── chatRoutes.js
│   └── uploadRoutes.js
├── middleware/
│   └── authMiddleware.js
├── controllers/
│   ├── chatController.js
│   └── uploadController.js
├── helpers.js
└── server.js
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── MainApp.js
│   │   ├── ProtectedRoute.js
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.js
│   └── App.js
```

## Environment Variables

Make sure to set these environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET`: Secret for access tokens (32+ chars)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (32+ chars)

## Troubleshooting

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **JWT Secrets**: Use strong, unique secrets for production
3. **CORS Issues**: Verify frontend URL in backend CORS configuration
4. **Token Expiration**: Check browser console for token refresh errors

## Production Deployment

1. **Environment Variables**: Set production values for all env vars
2. **MongoDB**: Use cloud MongoDB instance (Atlas, etc.)
3. **JWT Secrets**: Generate cryptographically secure secrets
4. **HTTPS**: Enable HTTPS for production
5. **Rate Limiting**: Consider adding rate limiting middleware
