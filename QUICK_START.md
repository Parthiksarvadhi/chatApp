# Chat App - Quick Start Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- PostgreSQL running locally
- Your machine IP address

## Setup

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup
```bash
cd chatapp
npm install
npx expo start --clear
```

### 3. Update API URL (if needed)
Edit `chatapp/services/api.ts` and `chatapp/services/socket.ts`:
- Replace `192.168.1.7` with your machine's IP address
- Find IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`

### 4. Run on Device

**iOS Simulator:**
```bash
npx expo start --ios
```

**Android Emulator:**
```bash
npx expo start --android
```

**Physical Device:**
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from terminal
3. Make sure phone is on same WiFi as your Mac

## Test Credentials

**Email:** `test@example.com`
**Password:** `password123`

Or create a new account via registration.

## Features to Test

1. **Login/Register** - Create account or login
2. **Create Group** - Use FAB on home tab
3. **Join Group** - Use Explore tab
4. **Send Messages** - Open chat and type
5. **Real-Time Updates** - Open on multiple devices
6. **Online Status** - See member status in chat
7. **Profile** - View user info

## Troubleshooting

### Network Error
- Check backend is running: `npm run dev` in backend folder
- Verify phone is on same WiFi
- Check API URL in `services/api.ts`
- Test in Safari: `http://192.168.1.7:5000/api/health`

### Messages Not Sending
- Check Socket.IO connection in console
- Verify backend is running
- Check network connectivity

### App Crashes
- Clear cache: `npx expo start --clear`
- Check console for errors
- Restart backend and app

## Project Structure

```
.
├── backend/              # Node.js Express backend
│   ├── src/
│   │   ├── config/      # Database & migrations
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── middleware/  # Auth & upload
│   └── server.js        # Main server file
│
└── chatapp/             # React Native frontend
    ├── app/             # Screens & navigation
    ├── services/        # API & Socket.IO
    ├── context/         # Auth context
    └── components/      # Reusable components
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Groups
- `POST /api/groups`
- `GET /api/groups`
- `POST /api/groups/:id/join`
- `GET /api/groups/:id`
- `GET /api/groups/:id/members`

### Messages
- `POST /api/messages/:groupId/send`
- `GET /api/messages/:groupId`
- `DELETE /api/messages/:id`

### Users
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/groups/:groupId/presence`

## Socket.IO Events

**Join Group:**
```javascript
socket.emit('join_group', groupId);
```

**Send Message:**
```javascript
socket.emit('send_message', {
  groupId: 1,
  content: 'Hello!',
  messageId: 123
});
```

**Set Presence:**
```javascript
socket.emit('set_presence', 'online'); // or 'offline', 'away'
```

## Database

PostgreSQL database: `chatapp`

Tables:
- `users` - User accounts
- `groups` - Chat groups/classrooms
- `group_members` - Group membership with roles
- `messages` - Chat messages
- `message_reads` - Read receipts
- `user_profiles` - User profile info
- `user_presence` - Online/offline status

## Next Steps

1. Deploy backend to cloud (Heroku, Railway, etc.)
2. Build and deploy app to App Store/Play Store
3. Add push notifications
4. Add file sharing
5. Add message search
6. Add user blocking
7. Add group settings

## Support

For issues:
1. Check console logs
2. Verify backend is running
3. Check network connectivity
4. Clear cache and restart
5. Check GitHub issues

## License

MIT
