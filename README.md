# 🌏 Four Season Travel - Multi-Layered Tour Booking System with AI Integration

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?style=flat-square&logo=spring)](https://spring.io/)
[![React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**Four Season Travel** is a modern, highly secure, and optimized Online Travel Agency (OTA) platform. The project is built on an **API-First Microservices Architecture**, strictly separating the Frontend (ReactJS), Backend Core (Spring Boot), Search Engine (Meilisearch), and AI Service (Python FastAPI).

---

## 🎥 YouTube Demo Videos

> *Note: Click on the thumbnail images below to play the video directly on YouTube.*

### 1. Customer Perspective (User Experience & Booking Flow)
*Showcases the modern responsive UI, mobile-first horizontal swipe/scroll lists, multi-language switching, and the seamless VietQR automatic deposit payment with Webhook/Polling integration.*

[![Customer Perspective](https://img.youtube.com/vi/[ID_VIDEO_YOUTUBE_1](https://youtu.be/0M9QiOg440I?si=VXuIdpVCDLDj6_zQ)/0.jpg)](https://www.youtube.com/watch?v=[ID_VIDEO_YOUTUBE_1](https://youtu.be/0M9QiOg440I?si=VXuIdpVCDLDj6_zQ))

### 2. Management Perspective (Author, Admin & System Security)
*Showcases the Author CMS Dashboard, Admin approval workflow (with Preview Modals, quick counters, and revenue reports), plus advanced non-functional security layers preventing brute-force and DDoS attacks.*

[![Management Perspective](https://img.youtube.com/vi/[ID_VIDEO_YOUTUBE_2](https://youtu.be/YZeWNQt0L-U)/0.jpg)](https://www.youtube.com/watch?v=[ID_VIDEO_YOUTUBE_2](https://youtu.be/YZeWNQt0L-U))

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies / Libraries |
| :--- | :--- |
| **Frontend (Client)** | ReactJS, Tailwind CSS, Axios, React Router DOM, react-i18next (Internationalization), Recharts (Data Visualization) |
| **Backend (Core API)** | Java, Spring Boot, Spring Data MongoDB, Spring Security, JWT (JSON Web Token), Spring Mail |
| **AI Service** | Python, FastAPI, TensorFlow/Keras, ResNet50 (Fine-Tuned), Google Colab |
| **Database** | MongoDB Atlas (Cloud NoSQL) |
| **Search Engine** | Meilisearch (High-performance full-text search) |
| **Security / DevOps** | BCrypt Password Hashing, Bucket4j (Rate Limiting), Invisible Google reCAPTCHA v3, Git/GitHub, Deployment (Vercel, Render, Railway) |

---

## ✨ Key Features

### 👤 1. For Customers (Users)
*   **Modern Responsive UI:** Clean layouts designed for mobile, featuring smooth horizontal swipe/scroll lists (Snap-scroll) on touch devices.
*   **Internationalization (i18n):** Real-time language switching (Vietnamese/English) for both static interface text and dynamic database records.
*   **Reviews & Rating System:** Users can write unlimited comments and rate locations/articles (1 to 5 stars). The rating is restricted to a **strict 1-rating-per-user** rule.
*   **20% Automated Deposit:** Integrates with VietQR API to dynamically calculate and generate a secure deposit QR code. Uses a **Webhook & Polling** mechanism to automatically confirm payments and trigger confirmation emails without manual confirmation button clicks.
*   **Quick Multi-Account Login:** Safely stores up to 7 recently used accounts on a single device for 3 days, enabling password-free, one-tap logins.

### ✍️ 2. For Content Creators (Authors)
*   **Content Management Dashboard (CMS):** Tracks all submitted tours and articles. Live statuses show whether content is *Approved, Pending, or Rejected/Removed by Admin*.
*   **Smart Tour Creator:** Features an Accordion-style location selector that groups locations alphabetically by region, preventing visual clutter when managing hundreds of destinations.
*   **Draft Management:** Authors retain full control to delete their pending drafts for content correction before Admin review.

### ⚙️ 3. For Administrators (Admin)
*   **Dual-Tier Dashboard:** Clean separation between Web Content Moderation and System Administration.
*   **Content Moderation Queue:** Displays real-time pending counters on tabs. Features an inline **Preview Modal** allowing admins to review the entire content/itinerary before approving or rejecting it.
*   **User Management:** Admins can view all accounts, promote standard users to Authors, or delete violating accounts.
*   **Revenue Analytics:** Features interactive year-to-month/quarter filters with dynamic Recharts data visualization. Tracks total deposits, pending orders, and ranks the Top 5 tours by revenue.

### 🛡️ 4. Security & Non-functional Requirements (Production-Grade)
*   **Concurrency & Overbooking Protection:** Combines MongoDB Atomic Updates (`findAndModify`) with Spring's `@Transactional` (ACID Transactions) to guarantee 100% data consistency. Prevents ticket overselling even if thousands of users book the last seat at the exact same millisecond.
*   **Brute-Force Prevention:** Implements an **exponential Account Lockout** mechanism (locks accounts for 5, 10, or 15 minutes after 5 consecutive failed login attempts, resetting the threshold the next day).
*   **DDoS & Spam Mitigation:** Uses **Bucket4j Rate Limiting** filter to block IP addresses making abnormally rapid API requests, throwing HTTP `429 Too Many Requests`.
*   **Invisible Bot Protection:** Integrates Google reCAPTCHA v3 (invisible mode) into authentication forms to block automated script submissions without bothering human users.
*   **Automatic Documentation:** Embeds **Swagger / OpenAPI 3.0** mapped with `Bearer JWT Security` configurations, allowing frontend developers to test secure endpoints directly from the browser.
*   **Automated Scheduling:** Features automated background tasks (Cron jobs running at 2:00 AM daily) to automatically cancel expired unpaid pending bookings.

---

## 🚀 Local Setup & Installation

### Prerequisites
*   JDK 17 or higher
*   Node.js (v18+)
*   Python 3.9+
*   MongoDB (Local or Atlas Cloud Cluster)

### Running the Application
1.  **Backend (Java):** Import the `backend` folder into IntelliJ IDEA, configure your secret credentials in `application-secret.properties`, and run `BackendApplication.java`.
2.  **AI Service (Python):** Open the AI folder in VS Code, run `pip install -r requirements.txt`, and start the server using `uvicorn main:app --port 8000`.
3.  **Frontend (React):** Open the `frontend` folder, configure your `.env` file, and run `npm install` followed by `npm start`.
