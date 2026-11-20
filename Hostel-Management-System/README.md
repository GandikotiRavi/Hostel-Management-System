# 🏨 HMS Pro — Hostel Management System

A **premium, production-quality** hostel management platform built with pure HTML, CSS, and JavaScript. Features a dark glassmorphism design with neon accents, fully functional portals for three user roles.

---

## ✨ Features

### 🎓 Student Portal
- Dashboard with room status, fee alerts, today's mess menu
- **Room Booking** — browse, filter, and book beds in real-time
- **Leave Requests** — apply and track leave with warden approval status
- **Maintenance Complaints** — file tickets, track progress, leave reviews
- **Mess Panel** — weekly menu, meal skip attendance, food ratings
- **Fees & Payment** — view dues, pay via simulated gateway, download receipts

### 🏠 Warden / Admin Portal (Full Admin Access)
- Dashboard with 8 live stats, occupancy chart, complaints chart, activity log
- **Student Management** — register students, **approve/reject admission applications**, reallocate rooms
- **Room Inventory** — add rooms, manage occupancy, view bed-wise allocation
- **Leave Management** — approve or reject leave requests with one click
- **Complaints Portal** — assign technicians, resolve tickets
- **Fee Records** — view all fees, mark fees as paid, download receipts
- **Email Alert Logs** — configure owner email, Web3Forms API, view email history

### 🍽️ Mess Manager Portal
- Dashboard with ratings stats, skip summary, food rating chart
- **Menu Editor** — edit any day's breakfast, lunch, dinner; notifies students
- **Ratings & Reviews** — view star ratings, comments, distribution chart

---

## 🔐 Demo Login Credentials

| Role | Roll No / Email | Password |
|------|----------------|----------|
| **Student** | `CS26101` | `password` |
| **Student** | `EC26105` | `password` |
| **Warden (Admin)** | _(select Warden)_ | `password` |
| **Mess Manager** | _(select Mess Mgr)_ | `password` |

> 💡 Use the **Quick Demo Access** buttons on the login page for instant one-click login!

### New Student Registration (Demo)
1. Click **"Apply for admission"** on the login page
2. Fill in details and submit
3. Log in as **Warden** → go to **Students** panel
4. See the pending application with **Approve & Allocate** / **Reject** buttons

---

## 🚀 How to Run

```bash
# No build tools needed — pure static files!
# Just open index.html in any modern browser

# Option 1: Double-click index.html
# Option 2: Use Live Server in VS Code
# Option 3: Python simple server
python -m http.server 8080
# Then open http://localhost:8080
```

---

## 🗂️ Project Structure

```
Hostel-Management-System/
├── index.html      # App structure — all panels, modals, forms
├── styles.css      # Dark glassmorphism design system (2200+ lines)
├── app.js          # Complete application logic (1700+ lines)
└── README.md       # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | Semantic HTML5 |
| Styling | CSS3 — Custom Properties, Glassmorphism, Grid, Flexbox |
| Logic | Vanilla ES6+ JavaScript |
| Charts | Chart.js (CDN) |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Inter — Google Fonts |
| Email | Web3Forms API (optional) |
| Storage | LocalStorage (browser-side) |

---

## 📧 Real Email Notifications (Optional)

1. Sign up at [web3forms.com](https://web3forms.com) (free)
2. Get your access key
3. Log in as **Warden** → **Email Alerts** panel
4. Enter your email + paste the Web3Forms key → Save

---

## 📱 Mobile Responsive

- Collapsible sidebar with hamburger menu
- Responsive grid layouts
- Touch-friendly buttons and toggles

---

## 🧑‍💻 Author

Built with ❤️ using HMS Pro Design System.
