# 🚀 Trip-Mate

Trip-Mate is a web app that helps users find and connect with travel companions.
It uses **Firebase Authentication** for user management and **Firestore** for storing trip details and destinations.

---

## 📁 Project Structure

```
Trip-Mate/
├── .gitignore
├── chat.html
├── chat.js
├── firebase.js
├── homepage.html
├── index.html
├── login.html
├── login.js
├── profile.html
├── profile.css
├── profile.js
├── README.md
├── signup.html
├── signup.css
├── signup.js
└── trip-actions.js
```

### 🔹 File Descriptions

| File                                        | Purpose                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **index.html**                              | Main landing page of the app                                                                  |
| **signup.html / signup.js / signup.css**    | Handles new user registration via Firebase                                                    |
| **login.html / login.js**                   | Handles user login and authentication                                                         |
| **homepage.html**                           | Dashboard/homepage after login                                                                |
| **profile.html / profile.js / profile.css** | Displays and updates user profile details                                                     |
| **chat.html / chat.js**                     | Real-time chat feature between trip mates                                                     |
| **trip-actions.js**                         | Contains Firestore operations (adding destinations, trips, etc.)                              |
| **firebase.js**                             | Firebase configuration and initialization *(excluded from Git using .gitignore for security)* |

---

## 🔧 Firebase Configuration

This project uses **Firebase v10** modules (ESM imports).

Your `firebase.js` contains- create on your own local device:

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTHDOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
```

> 🧩 **Note:** `firebase.js` is added to `.gitignore` to prevent exposing your API key publicly.

---

## ⚙️ How to Run Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/er-ishita/Trip-Mate
   cd Trip-Mate
   ```

2. **Open with VS Code Live Server**

   * Install the *Live Server* extension in VS Code.
   * Right-click on `index.html` → **Open with Live Server**.

3. **Test Firebase Connection**

   * Open the browser console (`Ctrl + Shift + I` → Console tab).
   * Perform a signup/login or add a trip.
   * If setup is correct, you’ll see Firestore writes in your Firebase console.

---

## 🔐 Firebase Rules (Recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> ✅ This allows only authenticated users to read/write data.

---

## 💡 Features

* Firebase Authentication (Signup/Login)
* Firestore Integration (Store destinations & trips)
* Profile Management
* Real-time Chat (planned/partially implemented)
* Secure configuration via `.gitignore`

---

## 🧠 Author

**Priyani Rajvanshi, Ishita Arora, Dhvani Joneja and Vaishnavi Singh**
Lumina Hackathon(by IEEE)-Project: *Trip-Mate*

> “Never go solo. Find your trip mate.”

---

Would you like me to include **Firebase Hosting deployment steps** (so you can publish it live)?
I can extend the README with that too.
