# VolunTech Frontend

This is the React Native/Expo frontend application for the VolunTech platform.

## 🚀 Tech Stack

- **React Native** (v0.79.5) - Cross-platform mobile development
- **React** (v19.0.0) - Latest React version
- **TypeScript** (v5.8.3) - Type-safe JavaScript
- **Expo** (v53.0.20) - React Native development platform
- **Expo Router** (v5.1.4) - File-based routing system

## 📁 Project Structure

```
Frontend/
├── app/                    # App screens and navigation
│   ├── (adminTabs)/       # Admin role screens
│   ├── (auth)/            # Authentication screens
│   ├── (organizationTabs)/ # Organization role screens
│   └── (volunteerTabs)/   # Volunteer role screens
├── components/             # Reusable UI components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── constants/              # App constants and API config
├── assets/                 # Images, fonts, and static files
└── package.json            # Frontend dependencies
```

## 🏃‍♂️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platform:**
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web
   ```

## 🔧 Development

- **Linting:** `npm run lint`
- **Reset project:** `npm run reset-project`

## 🌐 API Configuration

The frontend connects to the backend API. Make sure the backend server is running on port 4000, or set the `EXPO_PUBLIC_API_URL` environment variable.

## 📱 Features

- **Multi-role authentication** (Admin, Organization, Volunteer)
- **File-based routing** with Expo Router
- **Type-safe development** with TypeScript
- **Cross-platform support** (iOS, Android, Web)
- **Modern UI components** with haptic feedback and blur effects
