# 🏨 Hostel Operations & Student Services Management System (HMS Pro)

## 📌 Project Overview

**HMS Pro – Hostel Operations & Student Services Management System** is a web-based application designed to simplify and manage hostel operations and student-related activities through a centralized digital platform.

The system provides separate portals for Students, Hostel Administrators, and Mess Managers, allowing them to manage daily hostel activities efficiently. It helps reduce manual paperwork, improve communication, and provide a better hostel management experience.

The application features a modern, responsive user interface with a dark glassmorphism design and uses browser Local Storage to maintain application data.

## 🎯 Objectives

- Digitize hostel management and student services.
- Simplify room booking and allocation.
- Improve communication between students and hostel administrators.
- Manage student leave requests and approvals.
- Track hostel maintenance complaints.
- Simplify mess menu management.
- Provide a centralized platform for hostel-related activities.

## ✨ Key Features

### 👨‍🎓 1. Student Portal
- Student registration and login interface.
- View hostel-related information.
- Room booking functionality.
- Submit leave requests.
- Raise maintenance complaints.
- View fee payment information.
- Access hostel services and updates.

### 🏢 2. Hostel Administrator Portal
- Manage student-related activities.
- View and manage room bookings.
- Approve or reject student leave requests.
- Monitor maintenance complaints.
- Assign technicians to maintenance issues.
- Manage hostel operations.
- View application activity and email logs.

### 🍽️ 3. Mess Manager Portal
- Manage daily mess menus.
- Modify breakfast, lunch, and dinner details.
- Update food-related information.
- Maintain mess service information.

### 🔧 4. Additional Functionalities
- Responsive dashboard interface.
- Browser-based data persistence using Local Storage.
- Complaint management and technician assignment.
- Leave approval workflow.
- Fee payment interface.
- Email log and alert interface.
- Demo data reset functionality.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive UI |
| JavaScript ES6 | Application functionality and interactions |
| Local Storage | Persistent browser-side data storage |

## 🏗️ System Architecture

The application follows a client-side web architecture.

```text
        HOSTEL MANAGEMENT SYSTEM
                   |
          User Interface (UI)
                   |
             HTML5 + CSS3
                   |
            JavaScript ES6
                   |
          Application Logic
                   |
             Local Storage
                   |
       Browser-Based Data Storage
                   |
     --------------------------------
     |              |               |
   Student       Admin        Mess Manager
    Portal       Portal           Portal
```

## 💻 Application Modules

| Module | Description |
|---|---|
| Student Management | Student information and hostel services |
| Room Management | Room booking and allocation interface |
| Leave Management | Leave request and approval workflow |
| Complaint Management | Maintenance complaint tracking |
| Mess Management | Daily food menu management |
| Fee Management | Fee payment interface |
| Admin Dashboard | Centralized hostel administration |

## 🚀 Installation & Setup

Follow these steps to run the project on your local computer.

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

### Step 2: Navigate to the Project Folder

```bash
cd hostel-management-system
```

### Step 3: Open the Project

Open the project folder in Visual Studio Code.

### Step 4: Run the Application

You can run the application using the Live Server extension in VS Code.

Alternatively, if Python is installed, execute:

```bash
python -m http.server 3000
```

### Step 5: Access the Application

Open your browser and visit:

```text
http://localhost:3000
```

## 🖥️ User Roles

The application provides three different demo portals:

- **Student:** Access student services, room booking, leave requests, and complaints.
- **Hostel Administrator:** Manage hostel activities, student requests, and maintenance.
- **Mess Manager:** Manage daily mess menus and food-related information.

## 📂 Data Storage

The current version uses the browser's Local Storage mechanism to maintain application data.

- Data is stored locally in the user's browser.
- Data can persist across browser sessions.
- The application includes seeded demonstration records.
- Demo data can be reset by clearing the browser's site storage.

**Note:** This is a fully static, client-side application. It does not currently use a separate backend server or cloud database. Payment and email-related interfaces should be treated as demonstration functionality rather than real financial transactions or email delivery.

## 🔮 Future Enhancements

- Backend integration using Node.js and Express.js.
- Database integration using MongoDB or MySQL.
- Secure user authentication and authorization.
- Real-time notifications and email integration.
- Online payment gateway integration.
- Advanced reporting and analytics dashboard.
- Cloud deployment and hosting.
- Mobile-friendly hostel management experience.

## 🎓 Project Information

**Project Name:** Hostel Operations & Student Services Management System (HMS Pro)

**Project Domain:** Web Development

**Project Type:** Academic / Educational Project

**Development Technologies:** HTML5, CSS3, JavaScript ES6

## 👨‍💻 Developed By

**Gandikota Ravi Chandra**

BE – Computer Science and Engineering  
Specialization: Cloud Computing

## 📜 License

This project is developed for academic and educational purposes. You are welcome to explore the implementation and learn from the project.

---

⭐ If you find this project useful, consider giving the repository a star!
