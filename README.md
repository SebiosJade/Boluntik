# VolunTech - Volunteer Management Platform

A comprehensive mobile application for managing volunteer activities, organizations, and emergency responses.

## 🏗️ Project Structure

```
App/
├── Frontend/               # React Native/Expo mobile app
│   ├── app/               # App screens and navigation
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # App constants and API config
│   ├── assets/            # Images, fonts, and static files
│   └── package.json       # Frontend dependencies
├── Backend/                # Node.js/Express API server
│   ├── server/            # Server source code
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
└── README.md              # This file
```

## 🚀 Tech Stack

### Frontend
- **React Native** (v0.79.5) - Cross-platform mobile development
- **React** (v19.0.0) - Latest React version
- **TypeScript** (v5.8.3) - Type-safe JavaScript
- **Expo** (v53.0.20) - React Native development platform
- **Expo Router** (v5.1.4) - File-based routing system

### Backend
- **Node.js** with ES Modules
- **Express.js** (v4.19.2) - Web framework
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd App
```

### 2. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
The backend server will start on port 4000.

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm start
```

### 4. Run on Device/Simulator
- **iOS:** Press `i` in the terminal or scan QR code with Expo Go app
- **Android:** Press `a` in the terminal or scan QR code with Expo Go app
- **Web:** Press `w` in the terminal

## 📱 App Features

### User Roles
- **Admin:** Platform management, analytics, user management
- **Organization:** Event management, volunteer coordination, impact tracking
- **Volunteer:** Event discovery, calendar management, emergency response

### Key Features
- **Authentication & Authorization** with role-based access
- **File-based routing** with Expo Router
- **Cross-platform support** (iOS, Android, Web)
- **Modern UI components** with haptic feedback
- **Real-time updates** and notifications
- **Emergency response system**
- **Crowdfunding integration**
- **Virtual hub for remote volunteering**

## 🔧 Development

### Frontend Commands
```bash
cd Frontend
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on Web
npm run lint       # Run ESLint
```

### Backend Commands
```bash
cd Backend
npm start          # Start production server
npm run dev        # Start development server (with nodemon)
```

## 🌐 API Configuration

The frontend automatically detects the backend URL:
- **Development:** Automatically finds local IP and connects to port 4000
- **Production:** Set `EXPO_PUBLIC_API_URL` environment variable

## 📊 Data Storage

Currently using file-based JSON storage for development. The backend stores:
- User accounts and authentication
- Role-based permissions
- Onboarding status

## 🚧 Future Roadmap

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Real-time notifications
- [ ] Push notifications
- [ ] Offline support
- [ ] Advanced analytics
- [ ] Payment integration
- [ ] Social features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the individual README files in Frontend/ and Backend/
- Review the API documentation
- Open an issue in the repository
