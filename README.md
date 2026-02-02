#  <img width="50" height="50" alt="image" src="https://github.com/user-attachments/assets/f9bd4a9d-f673-454a-94cb-b3e4cfd71797" />SoulNotes – Daily Journal App

> **A digital space to write what your soul feels.**

SoulNotes is a cross-platform **daily journaling mobile application** developed as the **Final Project for the Advanced Mobile Development (AMD) module**. The app provides a secure, calm, and minimal digital space for users to write, manage, and reflect on their daily thoughts.

---

## 🔗 Project Links

- **GitHub Repository:**  
  [https://github.com/dil2003-av/SOUL_NOTES-Journal_App.git](https://github.com/dil2003-av/SOUL_NOTES-Journal_App.git)

- **APK Download (Android):**  
  🤖 Open this link on your Android device (or scan the QR code from Expo) to install the app:  
  [https://expo.dev/accounts/dilmikaushalya/projects/SoulNotes/builds/7e31a644-b61d-489a-b854-4dab2b31c10b](https://expo.dev/accounts/dilmikaushalya/projects/SoulNotes/builds/7e31a644-b61d-489a-b854-4dab2b31c10b)

---

## 📱 App Overview

- **App Name:** SoulNotes
- **Type:** Daily Journal / Personal Diary App
- **Platform:** Android & iOS (Cross-platform via Expo)
- **Frontend:** React Native (Expo)
- **Backend/Services:** Firebase (Authentication & Firestore)
- **Image Hosting:** Cloudinary
- **Navigation:** Expo Router (File-based routing)
- **Styling:** NativeWind / Tailwind CSS

---

## 🎯 Project Objectives

- Provide a **safe and private space** for users to write daily journal entries
- Implement **secure user authentication** using Firebase
- Support full **CRUD operations** for journal management
- Deliver a **clean, modern, and user-friendly** mobile UI
- Demonstrate practical usage of **advanced mobile app development concepts**

---

## ✨ Key Features

### 🔐 Authentication
- User Registration with email and password
- Secure Login & Logout
- Firebase Authentication integration

### 📝 Journal Management (CRUD)
- **Create** new journal entries
- **Read/View** saved journals
- **Update/Edit** existing journals
- **Delete** journals

### 👤 User Profile
- Update display name
- Upload and update profile picture (via Cloudinary)
- User data securely stored in Firestore

### 🧭 Navigation
- File-based routing using **Expo Router**
- Smooth and intuitive screen transitions
- User-friendly navigation flow

---

## 📂 Main Screens

1. **Splash Screen** – App intro and branding
2. **Login Screen** – User authentication
3. **Register Screen** – New user sign-up
4. **Home (Journal List) Screen** – View all journal entries
5. **Add Journal Screen** – Create new entries
6. **Edit/Delete Journal Screen** – Manage existing journals
7. **Profile Screen** – User profile management
8. **Journal Insights Screen** – Writing insights & statistics

---

## 🛠 Technologies Used

| Category | Technology |
|----------|-----------|
| **Framework** | React Native (Expo) |
| **Routing** | Expo Router |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore |
| **Image Storage** | Cloudinary |
| **State Management** | Context API |
| **Styling** | NativeWind / Tailwind CSS |
| **Build Tool** | Expo EAS |

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine
- Expo CLI (optional but recommended)
- Android Emulator / iOS Simulator / Physical device with Expo Go

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dil2003-av/SOUL_NOTES-Journal_App.git
   cd SOUL_NOTES-Journal_App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run the app**
   - Scan the QR code with **Expo Go** (Android/iOS)
   - Press `a` for **Android Emulator**
   - Press `i` for **iOS Simulator**
   - Use a **development build** for full native features

---

## 📦 Build Information

- Android APK generated using **Expo EAS Build**
- Compatible with **Android 5.0+** devices
- Built for academic submission and demonstration purposes
- Optimized for mobile performance and user experience

---

## 🔄 Development Workflow

This project uses **file-based routing** via Expo Router. All screens are located in the `app` directory.

### Project Structure
```
SoulNotes/
├── app/              # Main app screens (file-based routing)
├── assets/           # Images, fonts, and static resources
├── components/       # Reusable UI components
├── context/          # Context API for state management
├── firebase/         # Firebase configuration
└── services/            #  functions and helpers
```

### Reset Project (Optional)
To start with a fresh project structure:
```bash
npm run reset-project
```
This moves the starter code to `app-example` and creates a blank `app` directory.

---

## 📚 Learn More

To learn more about the technologies used in this project:

- **Expo Documentation:** [https://docs.expo.dev/](https://docs.expo.dev/)
- **React Native:** [https://reactnative.dev/](https://reactnative.dev/)
- **Firebase:** [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Expo Router:** [https://docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/)

---

## 👩‍💻 Developer

**Dilmi Kaushalya**  
Undergraduate Software Engineering Student  
Institute of Java Software Engineering (IJSE)

- GitHub: [@dil2003-av](https://github.com/dil2003-av)
- Project: Advanced Mobile Development Final Project

---

## 🤝 Contributing

This is an academic project, but feedback and suggestions are welcome! Feel free to:
- Open an issue for bugs or suggestions
- Fork the repository and experiment
- Contact the developer for collaboration

---

## 📄 License

This project is developed for educational purposes as part of the AMD module curriculum.

---

## 💚 Final Note

SoulNotes is designed to be more than just a journal app — **it is a digital sanctuary where your thoughts find peace, and your soul finds expression.**

Thank you for exploring SoulNotes! ✨

---

## 🌟 Join the Community

- **Expo on GitHub:** [https://github.com/expo/expo](https://github.com/expo/expo)
- **Discord Community:** [https://chat.expo.dev](https://chat.expo.dev)

---

**Made with 💜 using React Native & Expo**
