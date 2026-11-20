/* =================================================================
   HMS Pro — Hostel Management System | Complete Application Logic
   Version: 4.0 — Full Warden + Mess Manager + Student Registration
   ================================================================= */
'use strict';

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STATE
───────────────────────────────────────────────────────────────── */
let state = {
  currentUser: null,
  rooms: [], students: [], leaves: [], complaints: [],
  messMenu: {}, messFeedback: [], messAttendance: [], fees: [],
  notifications: [], emailLogs: [],
  ownerEmail: 'owner@hostelpro.com',
  emailNotificationsEnabled: true,
  web3formsKey: ''
};
let chartInstances = {};
let selectedRating = 4;

/* ─────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────── */
function getWeekdayName() {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
}
function getFormattedCurrentTime() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function genId(prefix) { return `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*100)}`; }
function fmtMoney(n) { return Number(n).toLocaleString('en-IN'); }
function el(id) { return document.getElementById(id); }

function statusBadge(status) {
  const cls = {
    'Active':'badge-active', 'Approved':'badge-approved', 'Paid':'badge-paid',
    'Resolved':'badge-resolved', 'Pending':'badge-pending', 'Rejected':'badge-rejected',
    'Unpaid':'badge-unpaid', 'In Progress':'badge-in-progress',
    'Full':'badge-rejected', 'Available':'badge-active'
  };
  return `<span class="badge ${cls[status]||'badge-info'}">${status}</span>`;
}

function statCard(icon, label, value, color) {
  return `<div class="stat-card glass">
    <div class="stat-icon" style="background:${color}22;color:${color}"><i class="fas ${icon}"></i></div>
    <div class="stat-info"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>
  </div>`;
}

function makeChart(id, type, labels, data, colors) {
  if (chartInstances[id]) { try { chartInstances[id].destroy(); } catch(e) {} delete chartInstances[id]; }
  const canvas = el(id);
  if (!canvas || typeof Chart === 'undefined') return;
  chartInstances[id] = new Chart(canvas.getContext('2d'), {
    type,
    data: { labels, datasets:[{ data, backgroundColor:colors, borderColor:colors,
      borderWidth: type==='bar'?0:2, borderRadius: type==='bar'?6:0, hoverOffset:8 }] },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'#cbd5e1', font:{family:'Inter',size:12}, boxWidth:12 } } },
      scales: type==='bar' ? {
        x:{ ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.05)'} },
        y:{ ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.05)'}, beginAtZero:true }
      } : {}
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const container = el('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success:'fa-check-circle', warning:'fa-exclamation-triangle', danger:'fa-times-circle', info:'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-bell'}"></i><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { if(toast.parentNode) toast.remove(); }, 400); }, 4000);
}

/* ─────────────────────────────────────────────────────────────────
   STATE PERSISTENCE
───────────────────────────────────────────────────────────────── */
function saveState() { localStorage.setItem('hms_pro_v4', JSON.stringify(state)); }
function loadState() {
  const saved = localStorage.getItem('hms_pro_v4');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      state.ownerEmail = state.ownerEmail || 'owner@hostelpro.com';
      state.emailNotificationsEnabled = state.emailNotificationsEnabled !== undefined ? state.emailNotificationsEnabled : true;
      state.web3formsKey = state.web3formsKey || '';
      state.emailLogs = state.emailLogs || [];
      state.notifications = state.notifications || [];
    } catch(e) { console.error('State parse error', e); }
  }
}

/* ─────────────────────────────────────────────────────────────────
   SEED DATABASE
───────────────────────────────────────────────────────────────── */
function seedDatabase() {
  if (localStorage.getItem('hms_pro_v4')) { loadState(); return; }

  state.messMenu = {
    Monday:    { Breakfast:'Masala Dosa, Coconut Chutney, Filter Coffee',       Lunch:'Steamed Rice, Sambar, Curd, Mixed Veg Salad', Dinner:'Roti, Dal Fry, Jeera Rice, Gulab Jamun' },
    Tuesday:   { Breakfast:'Idli (3), Vada (2), Sambar, Ginger Tea',            Lunch:'Jeera Rice, Chole Masala, Onion Raita, Papad', Dinner:'Butter Roti, Matar Paneer, Plain Rice, Custard' },
    Wednesday: { Breakfast:'Aloo Paratha, Butter, Curd, Mixed Pickle',           Lunch:'Veg Biryani, Mirchi Salan, Onion Raita',     Dinner:'Phulka, Mix Veg Sabzi, Dal Tadka, Fruit Salad' },
    Thursday:  { Breakfast:'Poha, Sev, Mint Chutney, Masala Chai',              Lunch:'Steamed Rice, Rasam, Cabbage Stir Fry, Curd', Dinner:'Roti, Egg Curry / Malai Kofta, Rice, Ice Cream' },
    Friday:    { Breakfast:'Bread, Butter, Boiled Egg / Jam, Coffee',            Lunch:'Rice, Kadhi Pakoda, Aloo Fry, Green Salad',   Dinner:'Butter Roti, Paneer Butter Masala, Veg Pulao' },
    Saturday:  { Breakfast:'Puri Bhaji, Sooji Halwa, Chai',                      Lunch:'Rajma Chawal, Pickled Onions, Curd',          Dinner:'Roti, Bhindi Masala, Dal Makhani, Gulab Jamun' },
    Sunday:    { Breakfast:'Rava Uttapam, Coconut Chutney, Tomato Chutney, Coffee', Lunch:'Special Thali (Dal Baati / Veg Thali)',   Dinner:'Roti, Veg Kadai, Dal Palak, Ice Cream' }
  };

  state.rooms = [
    { id:'A-101', block:'A', roomNo:'101', capacity:2, occupied:2, type:'2-Sharing', status:'Full',      amenities:['WiFi','Attached Bath'] },
    { id:'A-102', block:'A', roomNo:'102', capacity:2, occupied:1, type:'2-Sharing', status:'Available', amenities:['WiFi','Attached Bath'] },
    { id:'B-201', block:'B', roomNo:'201', capacity:3, occupied:3, type:'3-Sharing', status:'Full',      amenities:['WiFi','Common Bath','AC'] },
    { id:'B-202', block:'B', roomNo:'202', capacity:3, occupied:1, type:'3-Sharing', status:'Available', amenities:['WiFi','Common Bath'] },
    { id:'C-301', block:'C', roomNo:'301', capacity:1, occupied:0, type:'Single',    status:'Available', amenities:['WiFi','Attached Bath','AC','Balcony'] },
    { id:'C-302', block:'C', roomNo:'302', capacity:1, occupied:1, type:'Single',    status:'Full',      amenities:['WiFi','Attached Bath','AC'] },
    { id:'D-101', block:'D', roomNo:'101', capacity:4, occupied:2, type:'4-Sharing', status:'Available', amenities:['Common Bath','WiFi'] }
  ];

  state.students = [
    { id:'STU001', name:'Alex Mercer',    rollNo:'CS26101', branch:'Computer Science',  contact:'+91 98765 43210', email:'alex.m@univ.edu',   parentName:'Robert Mercer',    parentContact:'+91 98765 43211', bloodGroup:'O+',  roomNo:'A-101', status:'Active',  password:'password' },
    { id:'STU002', name:'Sarah Connor',   rollNo:'EC26105', branch:'Electronics',        contact:'+91 87654 32109', email:'sarah.c@univ.edu',  parentName:'Jane Connor',      parentContact:'+91 87654 32100', bloodGroup:'A+',  roomNo:'A-101', status:'Active',  password:'password' },
    { id:'STU003', name:'Bruce Wayne',    rollNo:'ME26202', branch:'Mechanical Eng',     contact:'+91 76543 21098', email:'bruce.w@univ.edu',  parentName:'Thomas Wayne',     parentContact:'+91 76543 21099', bloodGroup:'AB-', roomNo:'B-201', status:'Active',  password:'password' },
    { id:'STU004', name:'Diana Prince',   rollNo:'CV26108', branch:'Civil Eng',           contact:'+91 65432 10987', email:'diana.p@univ.edu',  parentName:'Hippolyta Prince', parentContact:'+91 65432 10988', bloodGroup:'B+',  roomNo:'B-201', status:'Active',  password:'password' },
    { id:'STU005', name:'Clark Kent',     rollNo:'CS26110', branch:'Computer Science',   contact:'+91 54321 09876', email:'clark.k@univ.edu',  parentName:'Jonathan Kent',    parentContact:'+91 54321 09877', bloodGroup:'O-',  roomNo:'B-201', status:'Active',  password:'password' },
    { id:'STU006', name:'Barry Allen',    rollNo:'CH26104', branch:'Chemical Eng',        contact:'+91 43210 98765', email:'barry.a@univ.edu',  parentName:'Henry Allen',      parentContact:'+91 43210 98766', bloodGroup:'A-',  roomNo:'A-102', status:'Active',  password:'password' },
    { id:'STU007', name:'Tony Stark',     rollNo:'EE26201', branch:'Electrical Eng',      contact:'+91 32109 87654', email:'tony.s@univ.edu',   parentName:'Howard Stark',     parentContact:'+91 32109 87655', bloodGroup:'B-',  roomNo:'C-302', status:'Active',  password:'password' },
    { id:'STU008', name:'Peter Parker',   rollNo:'CS26115', branch:'Computer Science',   contact:'+91 21098 76543', email:'peter.p@univ.edu',  parentName:'May Parker',       parentContact:'+91 21098 76544', bloodGroup:'O+',  roomNo:'B-202', status:'Active',  password:'password' },
    { id:'STU009', name:'Wanda Maximoff', rollNo:'BT26305', branch:'Biotechnology',      contact:'+91 10987 65432', email:'wanda.m@univ.edu',  parentName:'Oleg Maximoff',    parentContact:'+91 10987 65433', bloodGroup:'AB+', roomNo:'D-101', status:'Active',  password:'password' },
    { id:'STU010', name:'Steve Rogers',   rollNo:'HS26102', branch:'History & Arts',      contact:'+91 90123 45678', email:'steve.r@univ.edu',  parentName:'Joseph Rogers',    parentContact:'+91 90123 45679', bloodGroup:'A+',  roomNo:'D-101', status:'Active',  password:'password' },
    // A demo pending student so warden can see the approval workflow
    { id:'STU011', name:'Natasha Romanoff', rollNo:'CS26120', branch:'Computer Science', contact:'+91 99000 11234', email:'natasha.r@univ.edu', parentName:'Ivan Romanoff',   parentContact:'+91 99000 11235', bloodGroup:'O+',  roomNo:'',      status:'Pending', password:'password' }
  ];

  state.leaves = [
    { id:'LV-1001', studentId:'STU001', studentName:'Alex Mercer',  roomNo:'A-101', reason:'Family Wedding',               fromDate:'2026-08-15', toDate:'2026-08-18', status:'Approved', remarks:'Approved. Take care.' },
    { id:'LV-1002', studentId:'STU003', studentName:'Bruce Wayne',  roomNo:'B-201', reason:'Personal Medical Appointment',  fromDate:'2026-08-12', toDate:'2026-08-13', status:'Approved', remarks:'Permission granted.' },
    { id:'LV-1003', studentId:'STU007', studentName:'Tony Stark',   roomNo:'C-302', reason:'Internship Seminar',            fromDate:'2026-08-20', toDate:'2026-08-22', status:'Pending',  remarks:'' }
  ];

  state.complaints = [
    { id:'CP-2001', studentId:'STU001', studentName:'Alex Mercer',  roomNo:'A-101', category:'Plumbing',   description:'Water leakage from flush tank in attached bathroom.',    date:'2026-08-10', status:'Resolved',    assignedTo:'Plumber Dave',       feedback:'Fixed quickly! Great work.' },
    { id:'CP-2002', studentId:'STU002', studentName:'Sarah Connor', roomNo:'A-101', category:'Electrical', description:'Ceiling fan speed controller not working.',               date:'2026-08-11', status:'In Progress', assignedTo:'Electrician Sparks', feedback:'' },
    { id:'CP-2003', studentId:'STU008', studentName:'Peter Parker', roomNo:'B-202', category:'Internet',   description:'WiFi connection dropping frequently since morning.',      date:'2026-08-13', status:'Pending',     assignedTo:'',                   feedback:'' }
  ];

  state.messFeedback = [
    { id:'FB-3001', studentId:'STU001', studentName:'Alex Mercer',  date:'2026-08-11', rating:4, comments:'Loved the Veg Biryani on Wednesday lunch. Very flavourful!' },
    { id:'FB-3002', studentId:'STU003', studentName:'Bruce Wayne',  date:'2026-08-12', rating:5, comments:'Breakfast parathas were absolutely amazing today.' },
    { id:'FB-3003', studentId:'STU005', studentName:'Clark Kent',   date:'2026-08-13', rating:3, comments:'Monday lunch was a bit bland. Need more spices and variety.' }
  ];

  state.fees = [
    { id:'FE-4001', studentId:'STU001', studentName:'Alex Mercer',    semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:48000, status:'Paid',   dueDate:'2026-08-10', paidDate:'2026-08-08', receiptId:'RC-998822' },
    { id:'FE-4002', studentId:'STU002', studentName:'Sarah Connor',   semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:48000, status:'Paid',   dueDate:'2026-08-10', paidDate:'2026-08-09', receiptId:'RC-998823' },
    { id:'FE-4003', studentId:'STU003', studentName:'Bruce Wayne',    semester:'Semester 5 (Fall 2026)', totalAmount:52000, paidAmount:0,     status:'Unpaid', dueDate:'2026-08-30', paidDate:'',           receiptId:'' },
    { id:'FE-4004', studentId:'STU004', studentName:'Diana Prince',   semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:0,     status:'Unpaid', dueDate:'2026-08-30', paidDate:'',           receiptId:'' },
    { id:'FE-4005', studentId:'STU005', studentName:'Clark Kent',     semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:48000, status:'Paid',   dueDate:'2026-08-10', paidDate:'2026-08-07', receiptId:'RC-998824' },
    { id:'FE-4006', studentId:'STU006', studentName:'Barry Allen',    semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:0,     status:'Unpaid', dueDate:'2026-08-30', paidDate:'',           receiptId:'' },
    { id:'FE-4007', studentId:'STU007', studentName:'Tony Stark',     semester:'Semester 5 (Fall 2026)', totalAmount:52000, paidAmount:52000, status:'Paid',   dueDate:'2026-08-10', paidDate:'2026-08-05', receiptId:'RC-998825' },
    { id:'FE-4008', studentId:'STU008', studentName:'Peter Parker',   semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:0,     status:'Unpaid', dueDate:'2026-08-30', paidDate:'',           receiptId:'' },
    { id:'FE-4009', studentId:'STU009', studentName:'Wanda Maximoff', semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:0,     status:'Unpaid', dueDate:'2026-08-30', paidDate:'',           receiptId:'' },
    { id:'FE-4010', studentId:'STU010', studentName:'Steve Rogers',   semester:'Semester 5 (Fall 2026)', totalAmount:48000, paidAmount:48000, status:'Paid',   dueDate:'2026-08-10', paidDate:'2026-08-06', receiptId:'RC-998826' }
  ];

  state.notifications = [
    { id:'NT-1', title:'🍽️ Menu Updated',         message:'Mess Manager updated Friday dinner menu. Check it out!',              date:'2026-08-13 09:00', read:false },
    { id:'NT-2', title:'📋 Leave Request Received', message:'Tony Stark applied for leave from Aug 20–22.',                       date:'2026-08-13 10:15', read:false },
    { id:'NT-3', title:'🆕 New Admission Application', message:'Natasha Romanoff submitted hostel admission application.',        date:'2026-08-13 14:30', read:false }
  ];

  state.messAttendance = [
    { studentId:'STU001', date:'2026-08-13', meals:{ breakfast:true,  lunch:false, dinner:true } },
    { studentId:'STU002', date:'2026-08-13', meals:{ breakfast:true,  lunch:true,  dinner:true } },
    { studentId:'STU003', date:'2026-08-13', meals:{ breakfast:false, lunch:false, dinner:true } }
  ];

  state.emailLogs = [
    { id:'EM-5001', timestamp:'2026-08-13 09:15', recipient:'owner@hostelpro.com', subject:'Room Booking Alert',       body:'Alex Mercer booked Room A-101.',                   status:'Delivered (Mock)' },
    { id:'EM-5002', timestamp:'2026-08-13 10:15', recipient:'owner@hostelpro.com', subject:'Leave Request Submitted', body:'Tony Stark requested leave Aug 20–22.',            status:'Delivered (Mock)' },
    { id:'EM-5003', timestamp:'2026-08-13 14:30', recipient:'owner@hostelpro.com', subject:'New Admission Application', body:'Natasha Romanoff submitted an application.',    status:'Delivered (Mock)' }
  ];

  state.ownerEmail = 'owner@hostelpro.com';
  state.emailNotificationsEnabled = true;
  state.web3formsKey = '';
  saveState();
}

/* ─────────────────────────────────────────────────────────────────
   EMAIL ENGINE
───────────────────────────────────────────────────────────────── */
function sendAutomatedEmail(subject, body) {
  if (!state.emailNotificationsEnabled) return;
  const log = { id:genId('EM'), timestamp:getFormattedCurrentTime(), recipient:state.ownerEmail, subject, body, status:'Simulated' };
  if (state.web3formsKey) {
    fetch('https://api.web3forms.com/submit', {
      method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({ access_key:state.web3formsKey, subject, message:body, to:state.ownerEmail })
    }).then(r => { log.status = r.ok ? 'Delivered' : 'Failed (API Error)'; saveState(); })
      .catch(() => { log.status = 'Error (Network)'; saveState(); });
  }
  state.emailLogs.unshift(log);
  saveState();
}

/* ─────────────────────────────────────────────────────────────────
   JOIN / ADMISSION MODAL
───────────────────────────────────────────────────────────────── */
function openJoinModal() {
  const m = el('joinModal');
  if (m) m.classList.add('show');
}
function closeJoinModal() {
  const m = el('joinModal');
  if (m) m.classList.remove('show');
  const f = el('joinModalForm');
  if (f) f.reset();
}

function handleJoinApplication(e) {
  e.preventDefault();
  const name         = el('joinName').value.trim();
  const rollNo       = el('joinRoll').value.trim().toUpperCase();
  const branch       = el('joinBranch').value.trim();
  const contact      = el('joinContact').value.trim();
  const email        = el('joinEmail').value.trim();
  const blood        = el('joinBlood').value.trim();
  const parentName   = el('joinParent').value.trim();
  const parentContact= el('joinParentContact').value.trim();
  const password     = el('joinPass').value;

  if (!name || !rollNo || !branch || !contact || !password) {
    showToast('Please fill all required fields (*).', 'warning'); return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'warning'); return;
  }
  if (state.students.some(s => s.rollNo.toUpperCase() === rollNo)) {
    showToast('This roll number is already registered or pending review.', 'danger'); return;
  }

  const student = {
    id: `STU-${Date.now().toString().slice(-5)}`,
    name, rollNo, branch, contact,
    email: email || `${rollNo.toLowerCase()}@univ.edu`,
    parentName: parentName || 'N/A', parentContact: parentContact || 'N/A',
    bloodGroup: blood || 'N/A', roomNo: '', status: 'Pending', password
  };

  state.students.push(student);
  state.notifications.push({
    id: genId('NT'), title: '🆕 New Admission Application',
    message: `${name} (${rollNo}) submitted a hostel admission application for review.`,
    date: getFormattedCurrentTime(), read: false
  });
  sendAutomatedEmail(
    `New Admission Application — ${name}`,
    `New hostel admission application received:\n\nName: ${name}\nRoll No: ${rollNo}\nBranch: ${branch}\nContact: ${contact}\nEmail: ${student.email}\nParent: ${student.parentName} (${student.parentContact})\nBlood Group: ${student.bloodGroup}\nSubmitted: ${getFormattedCurrentTime()}`
  );
  saveState();
  showToast('Application submitted successfully! The warden will review within 24 hours.', 'success');
  closeJoinModal();
}

/* ─────────────────────────────────────────────────────────────────
   AUTHENTICATION
───────────────────────────────────────────────────────────────── */
function initAuth() {
  const loginForm      = el('loginForm');
  const roleSelect     = el('loginRole');
  const identifierGrp  = el('identifierGroup');
  const identifierInput= el('loginIdentifier');
  if (!loginForm || !roleSelect) return;

  function syncIdentifierField() {
    const isStudent = roleSelect.value === 'student';
    if (identifierGrp) identifierGrp.style.display = isStudent ? 'block' : 'none';
    if (identifierInput) identifierInput.required = isStudent;
  }
  roleSelect.addEventListener('change', syncIdentifierField);
  syncIdentifierField();

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const role       = roleSelect.value;
    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const pass       = el('loginPass').value;

    if (role === 'student') {
      const student = state.students.find(s =>
        s.rollNo.toLowerCase() === identifier.toLowerCase() ||
        s.email.toLowerCase() === identifier.toLowerCase()
      );
      if (!student) {
        showToast('Student not found! Check your roll number / email or apply for admission below.', 'danger'); return;
      }
      if (student.status === 'Rejected') {
        showToast('Your admission application was rejected. Please contact the hostel administration.', 'danger'); return;
      }
      const correctPass = student.password || 'password';
      if (pass !== correctPass) {
        showToast('Incorrect password! (Demo hint: use "password")', 'danger'); return;
      }
      state.currentUser = { id: student.id, name: student.name, role: 'student', username: student.rollNo };

    } else if (role === 'warden') {
      if (pass !== 'password') {
        showToast('Incorrect warden password! (Demo hint: use "password")', 'danger'); return;
      }
      state.currentUser = { id: 'WRD001', name: 'Dr. Arthur Pendelton', role: 'warden', username: 'warden_arthur' };

    } else if (role === 'mess') {
      if (pass !== 'password') {
        showToast('Incorrect mess manager password! (Demo hint: use "password")', 'danger'); return;
      }
      state.currentUser = { id: 'MESS001', name: 'Chef Marcus Vance', role: 'mess', username: 'mess_manager' };
    }

    saveState();
    showToast(`Welcome back, ${state.currentUser.name}! 🎉`, 'success');
    setupAppShell();
  });

  // Quick demo login buttons
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const role = this.getAttribute('data-role');
      roleSelect.value = role;
      if (role === 'student') {
        if (identifierGrp) identifierGrp.style.display = 'block';
        if (identifierInput) { identifierInput.value = 'CS26101'; identifierInput.required = true; }
      } else {
        if (identifierGrp) identifierGrp.style.display = 'none';
        if (identifierInput) { identifierInput.value = ''; identifierInput.required = false; }
      }
      el('loginPass').value = 'password';
      loginForm.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    });
  });
}

function handleLogout() {
  state.currentUser = null;
  saveState();
  el('loginPage').style.display = 'flex';
  el('appShell').style.display = 'none';
  // Destroy charts
  Object.keys(chartInstances).forEach(k => { try { chartInstances[k].destroy(); } catch(e) {} });
  chartInstances = {};
  showToast('Logged out successfully. See you again!', 'info');
}

/* ─────────────────────────────────────────────────────────────────
   APP SHELL
───────────────────────────────────────────────────────────────── */
function setupAppShell() {
  if (!state.currentUser) {
    el('loginPage').style.display = 'flex';
    el('appShell').style.display = 'none';
    return;
  }
  el('loginPage').style.display = 'none';
  el('appShell').style.display = 'flex';

  const user = state.currentUser;
  el('profileName').textContent = user.name;
  el('profileRole').textContent =
    user.role === 'warden' ? 'HOSTEL OWNER / ADMIN' :
    user.role === 'mess'   ? 'MESS MANAGER' : 'STUDENT';
  el('avatarLetter').textContent = user.name.charAt(0).toUpperCase();

  buildSidebarNav(user.role);
  el('btnLogout').onclick = handleLogout;
  updateNotifBadge();

  const initPanel = { student:'student-home', warden:'warden-dashboard', mess:'mess-dashboard' }[user.role];
  navigateToPanel(initPanel);
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR NAVIGATION
───────────────────────────────────────────────────────────────── */
function buildSidebarNav(role) {
  const nav = el('sidebarNav');
  if (!nav) return;
  nav.innerHTML = '';

  const student = (role === 'student' && state.currentUser)
    ? state.students.find(s => s.id === state.currentUser.id) : null;
  const stuIsActive = student ? student.status === 'Active' : true;

  const menus = {
    student: stuIsActive ? [
      { id:'student-home',      icon:'fa-home',               label:'Dashboard' },
      { id:'student-booking',   icon:'fa-key',                label:'Room Booking' },
      { id:'student-leave',     icon:'fa-plane-departure',    label:'Leave Request' },
      { id:'student-complaint', icon:'fa-exclamation-circle', label:'Complaints' },
      { id:'student-mess',      icon:'fa-utensils',           label:'Mess Panel' },
      { id:'student-fee',       icon:'fa-credit-card',        label:'Fees & Payment' }
    ] : [
      { id:'student-home', icon:'fa-home', label:'Dashboard' }
    ],

    warden: [
      { id:'warden-dashboard',  icon:'fa-chart-pie',       label:'Overview' },
      { id:'warden-students',   icon:'fa-user-graduate',   label:'Students' },
      { id:'warden-rooms',      icon:'fa-bed',             label:'Rooms' },
      { id:'warden-leaves',     icon:'fa-plane-departure', label:'Leave Requests' },
      { id:'warden-complaints', icon:'fa-wrench',          label:'Complaints' },
      { id:'warden-fees',       icon:'fa-receipt',         label:'Fee Records' },
      { id:'warden-emails',     icon:'fa-envelope',        label:'Email Alerts' }
    ],

    mess: [
      { id:'mess-dashboard',  icon:'fa-tachometer-alt', label:'Dashboard' },
      { id:'mess-menu-edit',  icon:'fa-edit',           label:'Manage Menu' },
      { id:'mess-ratings',    icon:'fa-star',           label:'Ratings' }
    ]
  };

  // Show pending badge on warden Students nav
  const pending = state.students.filter(s => s.status === 'Pending').length;

  (menus[role] || []).forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.id = `nav-${item.id}`;
    const badge = (role === 'warden' && item.id === 'warden-students' && pending > 0)
      ? `<span style="margin-left:auto;background:var(--amber);color:#000;border-radius:99px;padding:1px 7px;font-size:0.65rem;font-weight:700">${pending}</span>` : '';
    li.innerHTML = `<a href="javascript:void(0)" onclick="navigateToPanel('${item.id}')"><i class="fas ${item.icon}"></i><span>${item.label}</span>${badge}</a>`;
    nav.appendChild(li);
  });
}

function navigateToPanel(panelId) {
  loadState();
  document.querySelectorAll('.panel-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const panel = el(panelId);
  if (panel) panel.classList.add('active');
  const navItem = el(`nav-${panelId}`);
  if (navItem) navItem.classList.add('active');

  const titles = {
    'student-home':'Student Dashboard',          'student-booking':'Room Booking',
    'student-leave':'Leave Requests',            'student-complaint':'Maintenance Complaints',
    'student-mess':'Mess Panel',                 'student-fee':'Fees & Payment',
    'warden-dashboard':'Warden Overview',        'warden-students':'Student Management',
    'warden-rooms':'Rooms & Allocation',         'warden-leaves':'Leave Management',
    'warden-complaints':'Complaints Portal',     'warden-fees':'Fee Records',
    'warden-emails':'Email Alerts & Logs',       'mess-dashboard':'Mess Dashboard',
    'mess-menu-edit':'Edit Weekly Menu',         'mess-ratings':'Ratings & Reviews'
  };
  const subs = {
    'student-home':'Welcome back',               'student-booking':'Find & book your room bed',
    'student-leave':'Apply and track leave',     'student-complaint':'Register maintenance tickets',
    'student-mess':'Weekly menu & attendance',   'student-fee':'Pay fees and view invoices',
    'warden-dashboard':'System at a glance',     'warden-students':'Manage registrations & pending applications',
    'warden-rooms':'Room inventory management',  'warden-leaves':'Approve or reject leave requests',
    'warden-complaints':'Handle service tickets','warden-fees':'Fee collection registry',
    'warden-emails':'Configure email notifications', 'mess-dashboard':'Meal stats at a glance',
    'mess-menu-edit':'Update the weekly meal plan', 'mess-ratings':'Student feedback review'
  };
  if (el('topbarTitle')) el('topbarTitle').textContent = titles[panelId] || 'Dashboard';
  if (el('topbarSubtitle')) el('topbarSubtitle').textContent = subs[panelId] || 'HMS Pro';

  closeSidebar();
  renderPanelModule(panelId);
}

function renderPanelModule(panelId) {
  const map = {
    'student-home':      renderStudentHome,
    'student-booking':   renderStudentBooking,
    'student-leave':     renderStudentLeaves,
    'student-complaint': renderStudentComplaints,
    'student-mess':      renderStudentMess,
    'student-fee':       renderStudentFees,
    'warden-dashboard':  renderWardenDashboard,
    'warden-students':   renderWardenStudents,
    'warden-rooms':      renderWardenRooms,
    'warden-leaves':     renderWardenLeaves,
    'warden-complaints': renderWardenComplaints,
    'warden-fees':       renderWardenFees,
    'warden-emails':     renderWardenEmails,
    'mess-dashboard':    renderMessDashboard,
    'mess-menu-edit':    renderMessMenuEditor,
    'mess-ratings':      renderMessRatings
  };
  if (map[panelId]) map[panelId]();
}

/* ─────────────────────────────────────────────────────────────────
   MOBILE SIDEBAR
───────────────────────────────────────────────────────────────── */
function toggleSidebar() {
  el('sidebar').classList.toggle('mobile-open');
  el('sidebarOverlay').classList.toggle('show');
}
function closeSidebar() {
  if (el('sidebar')) el('sidebar').classList.remove('mobile-open');
  if (el('sidebarOverlay')) el('sidebarOverlay').classList.remove('show');
}

/* ─────────────────────────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────────────────────────── */
function updateNotifBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  const dot = el('notifDot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}
function renderNotifList() {
  const body = el('notifBody');
  if (!body) return;
  if (!state.notifications.length) {
    body.innerHTML = '<div class="notif-item"><span class="notif-msg">No notifications yet.</span></div>'; return;
  }
  body.innerHTML = [...state.notifications].reverse().map(n => `
    <div class="notif-item${n.read ? '' : ' unread'}">
      <div class="notif-title">${n.title}</div>
      <div class="notif-msg">${n.message}</div>
      <div class="notif-time">${n.date}</div>
    </div>`).join('');
  state.notifications.forEach(n => n.read = true);
  updateNotifBadge();
  saveState();
}

/* ══════════════════════════════════════════════════════════════
   ■ STUDENT PANELS
══════════════════════════════════════════════════════════════ */

/* ── Student Home ── */
function renderStudentHome() {
  const stu = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;
  const activeView  = el('studentActiveView');
  const pendingView = el('studentPendingView');

  if (stu.status === 'Pending' || stu.status === 'Rejected') {
    if (activeView)  activeView.style.display  = 'none';
    if (pendingView) {
      pendingView.style.display = 'block';
      const isRejected = stu.status === 'Rejected';
      pendingView.innerHTML = `
        <div class="section-card glass" style="max-width:580px;margin:40px auto;text-align:center;padding:40px;">
          <div style="font-size:4rem;margin-bottom:20px;color:${isRejected?'var(--rose)':'var(--amber)'}">
            <i class="fas fa-${isRejected?'times-circle':'user-clock'}"></i>
          </div>
          <h2 style="font-size:1.6rem;font-weight:800;margin-bottom:12px">
            ${isRejected ? '❌ Application Rejected' : '⏳ Application Under Review'}
          </h2>
          <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:24px">
            Hello <strong>${stu.name}</strong>!<br>
            ${isRejected
              ? 'Unfortunately, your hostel admission application was not approved.<br>Please contact the hostel administration for more information.'
              : 'Your hostel admission application has been submitted successfully and is being reviewed by the Hostel Warden.<br><br>You will be notified once approved.'
            }
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;text-align:left;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);padding:16px">
            <div><span style="color:var(--text-muted);font-size:0.78rem">Application ID</span><div style="font-weight:700;color:var(--cyan)">${stu.id}</div></div>
            <div><span style="color:var(--text-muted);font-size:0.78rem">Roll Number</span><div style="font-weight:700">${stu.rollNo}</div></div>
            <div><span style="color:var(--text-muted);font-size:0.78rem">Branch</span><div style="font-weight:600">${stu.branch}</div></div>
            <div><span style="color:var(--text-muted);font-size:0.78rem">Contact</span><div style="font-weight:600">${stu.contact}</div></div>
          </div>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;background:${isRejected?'rgba(248,113,113,0.1)':'rgba(251,191,36,0.1)'};color:${isRejected?'var(--rose)':'var(--amber)'};font-weight:600;font-size:0.85rem">
            <i class="fas fa-${isRejected?'ban':'hourglass-half'}"></i>
            ${isRejected ? 'Application Rejected — Contact Administration' : 'Awaiting Warden Approval…'}
          </div>
        </div>`;
    }
    return;
  }

  if (activeView)  activeView.style.display  = 'block';
  if (pendingView) pendingView.style.display  = 'none';

  const myLeaves     = state.leaves.filter(l => l.studentId === stu.id);
  const myComplaints = state.complaints.filter(c => c.studentId === stu.id);
  const myFee        = state.fees.find(f => f.studentId === stu.id);
  const room         = stu.roomNo ? state.rooms.find(r => r.id === stu.roomNo) : null;
  const today        = getWeekdayName();
  const menu         = state.messMenu[today] || {};

  if (el('studentStatsGrid')) el('studentStatsGrid').innerHTML =
    statCard('fa-bed',              'My Room',        stu.roomNo || 'Not Booked',   'var(--cyan)')    +
    statCard('fa-plane-departure',  'Leaves Applied', myLeaves.length,              'var(--blue)')    +
    statCard('fa-wrench',           'Open Tickets',   myComplaints.filter(c=>c.status!=='Resolved').length, 'var(--amber)') +
    statCard('fa-receipt',          'Fee Status',     myFee ? myFee.status : 'N/A', myFee&&myFee.status==='Paid'?'var(--emerald)':'var(--rose)');

  if (el('studentProfileCard')) el('studentProfileCard').innerHTML = `
    <div class="section-header"><h3><i class="fas fa-id-card"></i> My Profile</h3></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:0.875rem">
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Roll No</div><div style="font-weight:700;color:var(--cyan)">${stu.rollNo}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Branch</div><div style="font-weight:600">${stu.branch}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Room</div><div style="font-weight:700;color:${stu.roomNo?'var(--emerald)':'var(--rose)'}">${stu.roomNo || 'Not Allocated'}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Blood Group</div><div style="font-weight:700;color:var(--rose)">${stu.bloodGroup}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Phone</div><div style="font-weight:600">${stu.contact}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Email</div><div style="font-weight:600;word-break:break-all;font-size:0.82rem">${stu.email}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Parent</div><div style="font-weight:600">${stu.parentName}</div></div>
      <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Parent Phone</div><div style="font-weight:600">${stu.parentContact}</div></div>
    </div>
    ${room ? `<div style="margin-top:16px;padding:12px 14px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:var(--radius-md);font-size:0.82rem;line-height:1.6">
      <i class="fas fa-info-circle" style="color:var(--cyan)"></i>
      Room <strong>${room.id}</strong> · ${room.type} · Capacity ${room.capacity} · ${room.amenities.join(', ')}
    </div>` : ''}
    ${myFee && myFee.status==='Unpaid' ? `<div style="margin-top:12px;padding:12px 14px;background:var(--warning-bg);border:1px solid rgba(251,191,36,0.3);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:12px">
      <span style="font-size:0.82rem;color:var(--amber)"><i class="fas fa-exclamation-triangle"></i> Fee due: ₹${fmtMoney(myFee.totalAmount)} · Due ${myFee.dueDate}</span>
      <button class="btn btn-primary btn-sm" onclick="navigateToPanel('student-fee')">Pay Now</button>
    </div>` : ''}`;

  if (el('studentMenuCard')) el('studentMenuCard').innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-utensils"></i> Today's Menu</h3>
      <span class="badge badge-live"><i class="fas fa-circle" style="font-size:0.45rem;margin-right:4px"></i>${today}</span>
    </div>
    <div class="meal-row"><span class="meal-label">🌅 Breakfast</span><span class="meal-desc">${menu.Breakfast || 'Not set yet'}</span></div>
    <div class="meal-row"><span class="meal-label">☀️ Lunch</span><span class="meal-desc">${menu.Lunch || 'Not set yet'}</span></div>
    <div class="meal-row"><span class="meal-label">🌙 Dinner</span><span class="meal-desc">${menu.Dinner || 'Not set yet'}</span></div>`;
}

/* ── Student Booking ── */
function renderStudentBooking() {
  loadState();
  const stu = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;

  const currentRoom = stu.roomNo ? state.rooms.find(r => r.id === stu.roomNo) : null;
  if (el('currentBookingCard')) {
    if (currentRoom) {
      el('currentBookingCard').innerHTML = `
        <div class="section-header"><h3><i class="fas fa-bed"></i> My Current Room</h3>${statusBadge('Active')}</div>
        <div style="text-align:center;padding:12px 0 20px">
          <div style="font-size:2.8rem;font-weight:900;color:var(--cyan);letter-spacing:-2px">${currentRoom.id}</div>
          <div style="color:var(--text-secondary);margin-top:4px">${currentRoom.type} · Block ${currentRoom.block}</div>
          <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin:12px 0">
            ${currentRoom.amenities.map(a=>`<span class="badge badge-info">${a}</span>`).join('')}
          </div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">
            Occupancy: ${currentRoom.occupied} / ${currentRoom.capacity} beds
          </div>
          <button class="btn btn-danger" onclick="releaseRoom()">
            <i class="fas fa-sign-out-alt"></i> Release My Bed
          </button>
        </div>`;
    } else {
      el('currentBookingCard').innerHTML = `
        <div class="section-header"><h3><i class="fas fa-bed"></i> My Current Room</h3></div>
        <div style="text-align:center;padding:32px;color:var(--text-muted)">
          <i class="fas fa-door-open" style="font-size:3rem;margin-bottom:14px;opacity:0.4;display:block"></i>
          <div style="font-size:0.9rem">No room booked yet.</div>
          <div style="font-size:0.8rem;margin-top:4px">Browse available rooms below to book a bed.</div>
        </div>`;
    }
  }

  const blockF   = (el('bookFilterBlock')   || {}).value || '';
  const typeF    = (el('bookFilterType')    || {}).value || '';
  const vacancyF = (el('bookFilterVacancy') || {}).value || '';

  let rooms = [...state.rooms];
  if (blockF)              rooms = rooms.filter(r => r.block === blockF);
  if (typeF)               rooms = rooms.filter(r => r.type === typeF);
  if (vacancyF === 'vacant') rooms = rooms.filter(r => r.occupied < r.capacity);

  const grid = el('bookingRoomsGrid');
  if (!grid) return;
  grid.innerHTML = rooms.length ? rooms.map(r => {
    const avail = r.capacity - r.occupied;
    const isMine = stu.roomNo === r.id;
    const isFull = avail <= 0;
    const pct = Math.round((r.occupied / r.capacity) * 100);
    const barColor = pct >= 100 ? 'var(--rose)' : pct >= 60 ? 'var(--amber)' : 'var(--emerald)';
    let btn = isMine
      ? `<button class="btn btn-danger btn-sm" onclick="releaseRoom()"><i class="fas fa-sign-out-alt"></i> Release</button>`
      : !isFull
      ? `<button class="btn btn-primary btn-sm" onclick="bookRoom('${r.id}')"><i class="fas fa-plus-circle"></i> Book Bed</button>`
      : `<button class="btn btn-secondary btn-sm" disabled>Full</button>`;
    return `
      <div class="room-card glass ${isMine?'booked':''} ${isFull&&!isMine?'full':''}">
        <div class="room-header"><div class="room-id">${r.id}</div>${statusBadge(isFull&&!isMine?'Full':'Available')}</div>
        <div class="room-type">${r.type} · Block ${r.block}</div>
        <div class="room-amenities">${r.amenities.map(a=>`<span class="badge badge-info">${a}</span>`).join('')}</div>
        <div class="occ-bar-wrap">
          <div class="occ-bar-track"><div class="occ-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
          <span class="occ-label">${r.occupied}/${r.capacity} beds occupied</span>
        </div>
        <div class="room-actions">${btn}${isMine?'<div style="font-size:0.72rem;color:var(--cyan);text-align:center;margin-top:4px">✓ Your current room</div>':''}</div>
      </div>`;
  }).join('')
  : `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted)">
      <i class="fas fa-search" style="font-size:2.5rem;margin-bottom:12px;display:block;opacity:0.4"></i>
      No rooms match your filters.
    </div>`;
}

function bookRoom(roomId) {
  loadState();
  const stu  = state.students.find(s => s.id === state.currentUser.id);
  const room = state.rooms.find(r => r.id === roomId);
  if (!stu || !room) return;
  if (stu.roomNo)              { showToast('Please release your current bed before booking another.', 'warning'); return; }
  if (room.occupied >= room.capacity) { showToast('Room is fully occupied. Choose another room.', 'danger'); return; }
  stu.roomNo = roomId;
  room.occupied++;
  if (room.occupied >= room.capacity) room.status = 'Full';
  state.notifications.push({ id:genId('NT'), title:'🛏️ Room Booked', message:`You successfully booked a bed in Room ${roomId}.`, date:getFormattedCurrentTime(), read:false });
  sendAutomatedEmail(`Room Booking Alert — ${roomId}`, `Student ${stu.name} (${stu.rollNo}, Branch: ${stu.branch}) booked a bed in Room ${roomId}.\nDate: ${getFormattedCurrentTime()}`);
  saveState();
  showToast(`Bed booked in Room ${roomId} successfully! 🎉`, 'success');
  renderStudentBooking();
}

function releaseRoom() {
  loadState();
  const stu = state.students.find(s => s.id === state.currentUser.id);
  if (!stu || !stu.roomNo) { showToast('No room to release.', 'warning'); return; }
  const releasedId = stu.roomNo;
  const room = state.rooms.find(r => r.id === releasedId);
  if (room) { room.occupied = Math.max(0, room.occupied - 1); room.status = room.occupied < room.capacity ? 'Available' : 'Full'; }
  stu.roomNo = '';
  state.notifications.push({ id:genId('NT'), title:'🔓 Bed Released', message:`Your bed in Room ${releasedId} has been released.`, date:getFormattedCurrentTime(), read:false });
  sendAutomatedEmail(`Bed Released — Room ${releasedId}`, `Student ${stu.name} (${stu.rollNo}) released their bed in Room ${releasedId}.\nDate: ${getFormattedCurrentTime()}`);
  saveState();
  showToast(`Bed in Room ${releasedId} released successfully.`, 'info');
  renderStudentBooking();
}

/* ── Student Leaves ── */
function renderStudentLeaves() {
  const stu = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;
  const tbody = el('myLeavesBody');
  if (!tbody) return;
  const leaves = state.leaves.filter(l => l.studentId === stu.id);
  tbody.innerHTML = leaves.length
    ? [...leaves].reverse().map(l => `
        <tr>
          <td><code style="color:var(--cyan)">${l.id}</code></td>
          <td>${l.reason}</td>
          <td>${l.fromDate}</td>
          <td>${l.toDate}</td>
          <td>${statusBadge(l.status)}</td>
          <td>${l.remarks || '<span style="color:var(--text-muted)">—</span>'}</td>
        </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:28px">No leave applications yet. Apply above.</td></tr>';
}

function handleApplyLeave(e) {
  e.preventDefault();
  const reason   = el('leaveReason').value.trim();
  const fromDate = el('leaveFromDate').value;
  const toDate   = el('leaveToDate').value;
  if (!reason || !fromDate || !toDate) { showToast('Please fill all leave request fields.', 'warning'); return; }
  if (new Date(fromDate) > new Date(toDate)) { showToast('Departure date cannot be after return date.', 'warning'); return; }

  const stu = state.students.find(s => s.id === state.currentUser.id);
  const leave = { id:genId('LV'), studentId:stu.id, studentName:stu.name, roomNo:stu.roomNo||'Unallocated', reason, fromDate, toDate, status:'Pending', remarks:'' };
  state.leaves.push(leave);
  state.notifications.push({ id:genId('NT'), title:'📋 Leave Request Received', message:`${stu.name} applied for leave: ${fromDate} → ${toDate}`, date:getFormattedCurrentTime(), read:false });
  sendAutomatedEmail(`Leave Request — ${stu.name}`, `Student: ${stu.name} (${stu.rollNo})\nRoom: ${stu.roomNo||'N/A'}\nReason: ${reason}\nFrom: ${fromDate}  To: ${toDate}\nSubmitted: ${getFormattedCurrentTime()}`);
  saveState();
  showToast('Leave application submitted for warden approval!', 'success');
  el('leaveForm').reset();
  renderStudentLeaves();
}

/* ── Student Complaints ── */
function renderStudentComplaints() {
  const stu = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;
  const tbody = el('myComplaintsBody');
  if (!tbody) return;
  const complaints = state.complaints.filter(c => c.studentId === stu.id);
  tbody.innerHTML = complaints.length
    ? [...complaints].reverse().map(c => {
        const reviewBtn = c.status === 'Resolved' && !c.feedback
          ? `<button class="btn btn-secondary btn-xs" onclick="openFeedbackModal('${c.id}')"><i class="fas fa-comment"></i> Review</button>`
          : (c.feedback ? `<span style="font-size:0.78rem;color:var(--emerald)">✓ Reviewed</span>` : '<span style="color:var(--text-muted)">—</span>');
        return `
          <tr>
            <td><code style="color:var(--cyan)">${c.id}</code></td>
            <td><strong>${c.category}</strong></td>
            <td style="max-width:180px;font-size:0.82rem">${c.description}</td>
            <td>${c.date}</td>
            <td>${statusBadge(c.status)}</td>
            <td>${c.assignedTo || '<span style="color:var(--text-muted)">Pending</span>'}</td>
            <td>${reviewBtn}</td>
          </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:28px">No complaints filed yet.</td></tr>';
}

function handleLodgeComplaint(e) {
  e.preventDefault();
  const category    = el('complaintCategory').value;
  const description = el('complaintDesc').value.trim();
  if (!description) { showToast('Please describe the issue in detail.', 'warning'); return; }
  const stu = state.students.find(s => s.id === state.currentUser.id);
  const c = { id:genId('CP'), studentId:stu.id, studentName:stu.name, roomNo:stu.roomNo||'N/A', category, description, date:getFormattedCurrentTime().slice(0,10), status:'Pending', assignedTo:'', feedback:'' };
  state.complaints.push(c);
  state.notifications.push({ id:genId('NT'), title:'🔧 New Maintenance Ticket', message:`${stu.name} filed a ${category} complaint from Room ${stu.roomNo||'N/A'}.`, date:getFormattedCurrentTime(), read:false });
  sendAutomatedEmail(`Maintenance Ticket — ${category}`, `Student: ${stu.name} (${stu.rollNo})\nRoom: ${stu.roomNo||'N/A'}\nCategory: ${category}\nDescription: ${description}\nDate: ${getFormattedCurrentTime()}`);
  saveState();
  showToast('Maintenance ticket registered successfully!', 'success');
  el('complaintForm').reset();
  renderStudentComplaints();
}

function openFeedbackModal(complaintId) {
  el('feedbackComplaintId').value = complaintId;
  el('feedbackRemarks').value = '';
  el('feedbackModal').classList.add('show');
}
function closeFeedbackModal() { el('feedbackModal').classList.remove('show'); el('feedbackModalForm').reset(); }
function submitComplaintFeedback(e) {
  e.preventDefault();
  const id      = el('feedbackComplaintId').value;
  const remarks = el('feedbackRemarks').value.trim();
  if (!remarks) { showToast('Please write your feedback.', 'warning'); return; }
  const c = state.complaints.find(x => x.id === id);
  if (c) c.feedback = remarks;
  saveState();
  showToast('Thank you for your feedback! ✓', 'success');
  closeFeedbackModal();
  renderStudentComplaints();
}

/* ── Student Mess ── */
function renderStudentMess() {
  const stu   = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;
  const today = getFormattedCurrentTime().slice(0,10);
  const days  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const todayName = getWeekdayName();

  // Find or create today's attendance
  let att = state.messAttendance.find(a => a.studentId === stu.id && a.date === today);
  if (!att) {
    att = { studentId:stu.id, date:today, meals:{ breakfast:true, lunch:true, dinner:true } };
    // Don't push yet — push on first toggle
  }

  // Meal skip grid
  if (el('mealSkipGrid')) {
    const meals = [{ key:'breakfast', label:'Breakfast', icon:'🌅' }, { key:'lunch', label:'Lunch', icon:'☀️' }, { key:'dinner', label:'Dinner', icon:'🌙' }];
    el('mealSkipGrid').innerHTML = meals.map(m => `
      <div class="skip-toggle ${!att.meals[m.key]?'skipping':''}" onclick="toggleMealSkip('${m.key}')" id="skip-${m.key}">
        <span style="font-size:1.8rem;line-height:1">${m.icon}</span>
        <div style="font-weight:700;color:var(--text-primary);margin-top:4px">${m.label}</div>
        <div style="font-size:0.76rem;font-weight:600;margin-top:4px;color:${att.meals[m.key]?'var(--emerald)':'var(--rose)'}">
          ${att.meals[m.key]?'✓ Attending':'✗ Skipping'}
        </div>
      </div>`).join('');
  }

  // Star rating
  initStarRating();

  // Weekly menu grid
  if (el('messWeekGrid')) {
    el('messWeekGrid').innerHTML = days.map(day => {
      const m = state.messMenu[day] || {};
      const isToday = day === todayName;
      return `
        <div class="menu-day-card glass ${isToday?'today':''}">
          <div class="day-label">${day.substring(0,3).toUpperCase()}${isToday?` <span class="badge badge-live" style="font-size:0.58rem;padding:2px 6px;vertical-align:middle">Today</span>`:''}</div>
          <div class="meal-row"><span class="meal-label">🌅</span><span class="meal-desc">${m.Breakfast||'TBD'}</span></div>
          <div class="meal-row"><span class="meal-label">☀️</span><span class="meal-desc">${m.Lunch||'TBD'}</span></div>
          <div class="meal-row"><span class="meal-label">🌙</span><span class="meal-desc">${m.Dinner||'TBD'}</span></div>
        </div>`;
    }).join('');
  }
}

function initStarRating() {
  const container = el('starRating');
  if (!container) return;
  const stars = container.querySelectorAll('i');
  function paint(val) { stars.forEach((s,i) => s.classList.toggle('active', i < val)); }
  paint(selectedRating);
  stars.forEach((star,i) => {
    star.addEventListener('mouseover', () => paint(i+1));
    star.addEventListener('click',     () => { selectedRating = i+1; paint(i+1); });
  });
  container.addEventListener('mouseleave', () => paint(selectedRating));
}

function toggleMealSkip(meal) {
  loadState();
  const stu   = state.students.find(s => s.id === state.currentUser.id);
  const today = getFormattedCurrentTime().slice(0,10);
  let att = state.messAttendance.find(a => a.studentId === stu.id && a.date === today);
  if (!att) {
    att = { studentId:stu.id, date:today, meals:{ breakfast:true, lunch:true, dinner:true } };
    state.messAttendance.push(att);
  }
  att.meals[meal] = !att.meals[meal];
  saveState();
  const card = el(`skip-${meal}`);
  if (card) {
    const attending = att.meals[meal];
    card.classList.toggle('skipping', !attending);
    const statusEl = card.querySelector('div:last-child');
    if (statusEl) { statusEl.style.color = attending?'var(--emerald)':'var(--rose)'; statusEl.textContent = attending?'✓ Attending':'✗ Skipping'; }
    showToast(`${meal.charAt(0).toUpperCase()+meal.slice(1)}: marked as ${attending?'attending':'skipping'}.`, 'info');
  }
}

function submitMessFeedback(e) {
  e.preventDefault();
  const comments = el('messFeedbackComments').value.trim();
  const stu      = state.students.find(s => s.id === state.currentUser.id);
  state.messFeedback.push({ id:genId('FB'), studentId:stu.id, studentName:stu.name, date:getFormattedCurrentTime().slice(0,10), rating:selectedRating, comments });
  saveState();
  showToast(`${selectedRating}★ rating submitted! Thank you.`, 'success');
  el('messFeedbackForm').reset();
  selectedRating = 4;
  initStarRating();
}

/* ── Student Fees ── */
function renderStudentFees() {
  const stu       = state.students.find(s => s.id === state.currentUser.id);
  if (!stu) return;
  const fees      = state.fees.filter(f => f.studentId === stu.id);
  const container = el('studentFeeContainer');
  if (!container) return;
  if (!fees.length) {
    container.innerHTML = '<div class="section-card glass" style="text-align:center;padding:48px"><i class="fas fa-receipt" style="font-size:3rem;color:var(--text-muted);display:block;margin-bottom:12px"></i><p style="color:var(--text-muted)">No fee records found.</p></div>';
    return;
  }
  container.innerHTML = fees.map(fee => `
    <div class="fee-card glass" style="margin-bottom:16px">
      <div class="fee-header">
        <div>
          <div class="fee-semester">${fee.semester}</div>
          <div class="fee-id">${fee.id}</div>
        </div>
        ${statusBadge(fee.status)}
      </div>
      <div class="fee-amount">₹${fmtMoney(fee.totalAmount)}</div>
      <div class="fee-meta">
        <span>Due: <strong>${fee.dueDate || 'N/A'}</strong></span>
        ${fee.status==='Paid'?`<span>Paid on: <strong>${fee.paidDate}</strong></span><span>Receipt: <strong style="color:var(--cyan)">${fee.receiptId}</strong></span>`:''}
      </div>
      <div class="fee-actions">
        ${fee.status==='Unpaid'
          ?`<button class="btn btn-primary" onclick="openPaymentModal('${fee.id}')"><i class="fas fa-credit-card"></i> Pay ₹${fmtMoney(fee.totalAmount)}</button>`
          :`<button class="btn btn-secondary" onclick="printInvoice('${fee.id}')"><i class="fas fa-file-invoice"></i> View Receipt</button>`}
      </div>
    </div>`).join('');
}

function openPaymentModal(feeId) {
  const fee = state.fees.find(f => f.id === feeId);
  if (!fee) return;
  el('paymentFeeId').value = feeId;
  el('paymentAmountDisplay').textContent = fmtMoney(fee.totalAmount);
  el('payBtnAmount').textContent = fmtMoney(fee.totalAmount);
  el('paymentModalForm').reset();
  el('paymentFeeId').value = feeId;
  el('paymentAmountDisplay').textContent = fmtMoney(fee.totalAmount);
  el('payBtnAmount').textContent = fmtMoney(fee.totalAmount);
  el('paymentModal').classList.add('show');
}
function closePaymentModal() { el('paymentModal').classList.remove('show'); el('paymentModalForm').reset(); }

function handleMockPayment(e) {
  e.preventDefault();
  const feeId = el('paymentFeeId').value;
  const fee   = state.fees.find(f => f.id === feeId);
  if (!fee) return;
  fee.status     = 'Paid';
  fee.paidAmount = fee.totalAmount;
  fee.paidDate   = getFormattedCurrentTime().slice(0,10);
  fee.receiptId  = `RC-${Date.now().toString().slice(-6)}`;
  state.notifications.push({ id:genId('NT'), title:'💳 Payment Successful', message:`Fee of ₹${fmtMoney(fee.totalAmount)} paid. Receipt: ${fee.receiptId}`, date:getFormattedCurrentTime(), read:false });
  sendAutomatedEmail(`Fee Payment Received — ${fee.studentName}`, `Student: ${fee.studentName}\nSemester: ${fee.semester}\nAmount: ₹${fee.totalAmount}\nReceipt ID: ${fee.receiptId}\nDate: ${fee.paidDate}`);
  saveState();
  showToast(`Payment of ₹${fmtMoney(fee.totalAmount)} successful! 🎉 Receipt: ${fee.receiptId}`, 'success');
  closePaymentModal();
  renderStudentFees();
}

function printInvoice(feeId) {
  loadState();
  const fee = state.fees.find(f => f.id === feeId);
  if (!fee) return;
  const stu = state.students.find(s => s.id === fee.studentId);
  el('invoiceModalBody').innerHTML = `
    <div class="invoice-view">
      <div style="text-align:center;border-bottom:2px solid var(--cyan);padding-bottom:18px;margin-bottom:22px">
        <div style="font-size:1.5rem;font-weight:900;color:var(--cyan)">🏨 HMS Pro</div>
        <div style="color:var(--text-muted);font-size:0.78rem;margin-top:2px">Official Payment Receipt</div>
        <div style="color:var(--emerald);font-size:0.72rem;margin-top:4px">✓ PAYMENT VERIFIED</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px;font-size:0.875rem">
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Receipt ID</div><div style="font-weight:800;color:var(--cyan)">${fee.receiptId}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Record ID</div><div style="font-weight:600">${fee.id}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Student Name</div><div style="font-weight:700">${fee.studentName}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Roll Number</div><div style="font-weight:600">${stu?stu.rollNo:'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Room</div><div style="font-weight:600">${stu&&stu.roomNo?stu.roomNo:'N/A'}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Branch</div><div style="font-weight:600">${stu?stu.branch:'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Semester</div><div style="font-weight:600">${fee.semester}</div></div>
        <div><div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;margin-bottom:4px">Payment Date</div><div style="font-weight:600">${fee.paidDate}</div></div>
      </div>
      <div style="background:rgba(52,211,153,0.07);border:1px solid rgba(52,211,153,0.25);border-radius:var(--radius-md);padding:22px;text-align:center;margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px">Total Amount Paid</div>
        <div style="font-size:2.2rem;font-weight:900;color:var(--emerald)">₹${fmtMoney(fee.totalAmount)}</div>
        <div style="font-size:0.72rem;color:var(--emerald);margin-top:4px">✓ Payment Verified & Confirmed</div>
      </div>
      <div style="text-align:center;font-size:0.72rem;color:var(--text-muted)">System generated receipt. No signature required. | HMS Pro</div>
    </div>`;
  el('invoiceModal').classList.add('show');
}
function closeInvoiceModal() { el('invoiceModal').classList.remove('show'); }
function triggerInvoicePrint() { window.print(); }

/* ══════════════════════════════════════════════════════════════
   ■ WARDEN PANELS (Full Admin Access)
══════════════════════════════════════════════════════════════ */

/* ── Warden Dashboard ── */
function renderWardenDashboard() {
  loadState();
  const activeStudents  = state.students.filter(s => s.status === 'Active').length;
  const pendingStudents = state.students.filter(s => s.status === 'Pending').length;
  const totalBeds       = state.rooms.reduce((a,r) => a+r.capacity, 0);
  const occupiedBeds    = state.rooms.reduce((a,r) => a+r.occupied, 0);
  const pendingLeaves   = state.leaves.filter(l => l.status === 'Pending').length;
  const openComplaints  = state.complaints.filter(c => c.status !== 'Resolved').length;
  const unpaidFees      = state.fees.filter(f => f.status === 'Unpaid').length;
  const collectedFees   = state.fees.filter(f => f.status === 'Paid').reduce((a,f)=>a+f.paidAmount,0);

  el('wardenStatsGrid').innerHTML =
    statCard('fa-users',         'Active Students',    activeStudents,                           'var(--cyan)')    +
    statCard('fa-bed',           'Bed Occupancy',      `${occupiedBeds}/${totalBeds}`,           'var(--blue)')    +
    statCard('fa-user-clock',    'Pending Admissions', pendingStudents,                          'var(--amber)')   +
    statCard('fa-plane-departure','Pending Leaves',    pendingLeaves,                            'var(--violet)')  +
    statCard('fa-wrench',        'Open Tickets',       openComplaints,                           'var(--rose)')    +
    statCard('fa-rupee-sign',    'Fees Collected',     `₹${fmtMoney(collectedFees)}`,            'var(--emerald)') +
    statCard('fa-receipt',       'Unpaid Fees',        unpaidFees,                               'var(--rose)')    +
    statCard('fa-home',          'Total Rooms',        state.rooms.length,                       'var(--indigo)');

  // Occupancy chart
  makeChart('chartOccupancy', 'doughnut',
    ['Occupied', 'Available'],
    [occupiedBeds, totalBeds-occupiedBeds],
    ['rgba(34,211,238,0.85)', 'rgba(100,116,139,0.35)']
  );

  // Complaints by category
  const catMap = {};
  state.complaints.forEach(c => { catMap[c.category] = (catMap[c.category]||0)+1; });
  const catColors = ['#22d3ee','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa'];
  makeChart('chartComplaints', 'bar',
    Object.keys(catMap), Object.values(catMap),
    catColors.slice(0, Object.keys(catMap).length)
  );

  // Activity log
  const activities = [
    ...state.leaves.slice(-4).map(l=>({ icon:'fa-plane-departure', color:'var(--blue)',    text:`${l.studentName} applied for leave`, time:l.fromDate, label:l.status })),
    ...state.complaints.slice(-4).map(c=>({ icon:'fa-wrench',       color:'var(--amber)',   text:`${c.studentName} filed ${c.category} complaint`, time:c.date, label:c.status })),
    ...state.fees.filter(f=>f.status==='Paid').slice(-3).map(f=>({ icon:'fa-credit-card',  color:'var(--emerald)', text:`${f.studentName} paid semester fee`, time:f.paidDate, label:'Paid' })),
    ...state.students.filter(s=>s.status==='Pending').slice(-2).map(s=>({ icon:'fa-user-clock', color:'var(--amber)', text:`${s.name} submitted admission application`, time:'Pending', label:'Pending' }))
  ].sort((a,b) => b.time>a.time?1:-1).slice(0,8);

  if (el('activityLog')) el('activityLog').innerHTML = activities.length
    ? activities.map(a=>`
        <div class="activity-item">
          <div class="activity-icon" style="background:${a.color}22;color:${a.color}"><i class="fas ${a.icon}"></i></div>
          <div class="activity-info"><div>${a.text}</div><div class="activity-time">${a.time}</div></div>
          ${statusBadge(a.label)}
        </div>`).join('')
    : '<div style="text-align:center;color:var(--text-muted);padding:20px">No recent activity.</div>';
}

/* ── Warden Students (with Registration Approval) ── */
function renderWardenStudents() {
  loadState();

  // ── Pending Applications (APPROVE / REJECT) ──
  const pending = state.students.filter(s => s.status === 'Pending');
  const pendingSection = el('pendingStudentsSection');
  if (pendingSection) pendingSection.style.display = pending.length ? 'block' : 'none';
  if (el('pendingStudentsBody')) {
    el('pendingStudentsBody').innerHTML = pending.length
      ? pending.map(s => `
          <tr style="background:rgba(251,191,36,0.03)">
            <td><code style="color:var(--amber)">${s.id}</code></td>
            <td>
              <strong>${s.name}</strong>
              <div style="font-size:0.76rem;color:var(--text-muted)">${s.rollNo} · ${s.branch}</div>
            </td>
            <td>${s.branch}</td>
            <td>${s.contact}</td>
            <td>${s.parentName||'—'}<br><small style="color:var(--text-muted)">${s.parentContact||'—'}</small></td>
            <td>
              <div style="display:flex;flex-direction:column;gap:6px">
                <button class="btn btn-success btn-xs" onclick="openAllocateRoomModal('${s.id}')">
                  <i class="fas fa-check-circle"></i> Approve & Allocate
                </button>
                <button class="btn btn-danger btn-xs" onclick="rejectAdmission('${s.id}')">
                  <i class="fas fa-times-circle"></i> Reject Application
                </button>
              </div>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px">No pending applications.</td></tr>';
  }

  // ── Active Students Directory ──
  const active = state.students.filter(s => s.status === 'Active');
  if (el('studentsBody')) {
    el('studentsBody').innerHTML = active.length
      ? active.map(s => `
          <tr>
            <td><code style="color:var(--cyan)">${s.id}</code></td>
            <td>
              <strong>${s.name}</strong>
              <div style="font-size:0.76rem;color:var(--text-muted)">${s.rollNo}</div>
            </td>
            <td>${s.branch}</td>
            <td>${s.roomNo?`<span class="badge badge-active">${s.roomNo}</span>`:'<span class="badge badge-pending">None</span>'}</td>
            <td>${s.contact}</td>
            <td>${s.parentName}<br><small style="color:var(--text-muted)">${s.parentContact}</small></td>
            <td>
              <button class="btn btn-secondary btn-xs" onclick="openAllocateRoomModal('${s.id}')">
                <i class="fas fa-exchange-alt"></i> Reallocate
              </button>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:28px">No active students.</td></tr>';
  }

  // ── Room dropdown for Add Student form ──
  if (el('addStdRoomSelect')) {
    el('addStdRoomSelect').innerHTML = '<option value="">— Assign Later —</option>' +
      state.rooms.filter(r => r.occupied < r.capacity).map(r =>
        `<option value="${r.id}">${r.id} — ${r.type} (${r.capacity-r.occupied} bed${r.capacity-r.occupied!==1?'s':''} free)</option>`
      ).join('');
  }

  // Rebuild sidebar nav to update pending badge
  if (state.currentUser) buildSidebarNav(state.currentUser.role);
}

function handleAddStudent(e) {
  e.preventDefault();
  const name         = el('addStdName').value.trim();
  const rollNo       = el('addStdRoll').value.trim().toUpperCase();
  const branch       = el('addStdBranch').value.trim();
  const contact      = el('addStdContact').value.trim();
  const email        = el('addStdEmail').value.trim();
  const blood        = el('addStdBlood').value.trim();
  const parentName   = el('addStdParent').value.trim();
  const parentContact= el('addStdParentContact').value.trim();
  const roomId       = el('addStdRoomSelect').value;

  if (!name || !rollNo || !branch || !contact) { showToast('Fill all required fields (*).', 'warning'); return; }
  if (state.students.some(s => s.rollNo.toUpperCase() === rollNo)) { showToast('Roll number already exists!', 'danger'); return; }

  if (roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (room && room.occupied >= room.capacity) { showToast('Selected room is full!', 'danger'); return; }
  }

  const stu = {
    id: `STU-${Date.now().toString().slice(-5)}`,
    name, rollNo, branch, contact,
    email: email || `${rollNo.toLowerCase()}@univ.edu`,
    parentName: parentName||'N/A', parentContact: parentContact||'N/A',
    bloodGroup: blood||'N/A', roomNo: roomId||'', status:'Active', password:'password'
  };

  if (roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (room) { room.occupied++; if (room.occupied >= room.capacity) room.status = 'Full'; }
  }

  state.students.push(stu);
  state.fees.push({
    id:genId('FE'), studentId:stu.id, studentName:stu.name,
    semester:`Semester — Fall ${new Date().getFullYear()}`, totalAmount:48000, paidAmount:0,
    status:'Unpaid', dueDate:'', paidDate:'', receiptId:''
  });
  sendAutomatedEmail(`New Student Registered — ${name}`, `Student registered by warden:\nName: ${name}\nRoll: ${rollNo}\nBranch: ${branch}\nRoom: ${roomId||'TBD'}\nContact: ${contact}`);
  saveState();
  showToast(`Student ${name} registered successfully!`, 'success');
  el('addStudentForm').reset();
  renderWardenStudents();
}

function rejectAdmission(id) {
  loadState();
  const stu = state.students.find(s => s.id === id);
  if (!stu) return;
  if (!confirm(`Reject admission for ${stu.name} (${stu.rollNo})?\n\nThis cannot be undone.`)) return;
  stu.status = 'Rejected';
  state.notifications.push({ id:genId('NT'), title:'❌ Admission Rejected', message:`${stu.name}'s admission application has been rejected.`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`Application for ${stu.name} has been rejected.`, 'danger');
  renderWardenStudents();
}

/* Room Allocation / Approval Modal */
function openAllocateRoomModal(studentId) {
  loadState();
  const stu = state.students.find(s => s.id === studentId);
  if (!stu) return;
  el('allocStudentId').value = studentId;
  el('allocStudentName').textContent = `${stu.name} (${stu.rollNo})`;
  const isPending = stu.status === 'Pending';
  el('allocModalTitle').textContent = isPending ? '✅ Approve & Allocate Room' : '🔄 Reallocate Room';
  el('allocSubmitBtn').textContent   = isPending ? '✓ Approve & Allocate' : '⇄ Reallocate Room';
  el('allocSubmitBtn').className     = `btn ${isPending?'btn-success':'btn-primary'}`;

  const sel = el('allocRoomSelect');
  sel.innerHTML = '<option value="">— No Room (allocate later) —</option>' +
    state.rooms
      .filter(r => r.occupied < r.capacity || r.id === stu.roomNo)
      .map(r => `<option value="${r.id}" ${r.id===stu.roomNo?'selected':''}>${r.id} — ${r.type} · ${r.capacity-r.occupied} bed(s) free</option>`)
      .join('');
  el('allocModal').classList.add('show');
}
function closeAllocateRoomModal() { el('allocModal').classList.remove('show'); }

function submitRoomAllocation(e) {
  e.preventDefault();
  const stuId   = el('allocStudentId').value;
  const newRoom = el('allocRoomSelect').value;
  const stu     = state.students.find(s => s.id === stuId);
  if (!stu) return;

  // Release old room
  if (stu.roomNo && stu.roomNo !== newRoom) {
    const old = state.rooms.find(r => r.id === stu.roomNo);
    if (old) { old.occupied = Math.max(0,old.occupied-1); old.status = old.occupied<old.capacity?'Available':'Full'; }
  }
  // Book new room
  if (newRoom && newRoom !== stu.roomNo) {
    const nw = state.rooms.find(r => r.id === newRoom);
    if (nw) { if (nw.occupied >= nw.capacity) { showToast('Room is full! Choose another.','danger'); return; } nw.occupied++; if (nw.occupied >= nw.capacity) nw.status = 'Full'; }
  }

  stu.roomNo = newRoom || '';
  const wasPending = stu.status === 'Pending';
  if (wasPending) {
    stu.status = 'Active';
    state.fees.push({ id:genId('FE'), studentId:stu.id, studentName:stu.name, semester:`Semester — Fall ${new Date().getFullYear()}`, totalAmount:48000, paidAmount:0, status:'Unpaid', dueDate:'', paidDate:'', receiptId:'' });
    state.notifications.push({ id:genId('NT'), title:'🎉 Admission Approved!', message:`Welcome, ${stu.name}! Your admission has been approved. Room: ${newRoom||'TBD'}.`, date:getFormattedCurrentTime(), read:false });
    sendAutomatedEmail(`Admission Approved — ${stu.name}`, `Student ${stu.name} (${stu.rollNo}) has been approved and allocated Room ${newRoom||'TBD'}.`);
  }

  saveState();
  showToast(wasPending ? `${stu.name}'s admission approved! Room: ${newRoom||'TBD'}` : `Room reallocated for ${stu.name}.`, 'success');
  closeAllocateRoomModal();
  renderWardenStudents();
}

/* ── Warden Rooms ── */
function renderWardenRooms() {
  loadState();
  const grid = el('wardenRoomsGrid');
  if (grid) {
    grid.innerHTML = state.rooms.length ? state.rooms.map(r => {
      const pct    = Math.round((r.occupied/r.capacity)*100);
      const color  = pct>=100?'var(--rose)':pct>=60?'var(--amber)':'var(--emerald)';
      const occ    = state.students.filter(s => s.roomNo === r.id);
      return `
        <div class="room-card glass ${r.status==='Full'?'full':''}">
          <div class="room-header"><div class="room-id">${r.id}</div>${statusBadge(r.status)}</div>
          <div class="room-type">${r.type} · Block ${r.block}</div>
          <div class="room-amenities">${r.amenities.map(a=>`<span class="badge badge-info">${a}</span>`).join('')}</div>
          <div class="occ-bar-wrap">
            <div class="occ-bar-track"><div class="occ-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <span class="occ-label">${r.occupied}/${r.capacity} occupied (${pct}%)</span>
          </div>
          ${occ.length?`<div style="margin-top:10px;font-size:0.74rem;color:var(--text-muted);line-height:1.6">${occ.map(s=>`<i class="fas fa-user" style="font-size:0.6rem;color:var(--cyan)"></i> ${s.name}`).join('  ')}</div>`:''}
        </div>`;
    }).join('')
    : '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:48px">No rooms in inventory.</div>';
  }
  // Repopulate student form dropdown
  if (el('addStdRoomSelect')) {
    el('addStdRoomSelect').innerHTML = '<option value="">— Assign Later —</option>' +
      state.rooms.filter(r=>r.occupied<r.capacity).map(r=>`<option value="${r.id}">${r.id} — ${r.type} (${r.capacity-r.occupied} free)</option>`).join('');
  }
}

function handleAddRoom(e) {
  e.preventDefault();
  const block  = el('addRoomBlock').value.trim().toUpperCase();
  const roomNo = el('addRoomNo').value.trim();
  const cap    = parseInt(el('addRoomCap').value);
  const type   = el('addRoomType').value;
  const ams    = [];
  if (el('amenWifi').checked) ams.push('WiFi');
  if (el('amenAC').checked)   ams.push('AC');
  if (el('amenBath').checked) ams.push('Attached Bath');
  if (!block||!roomNo||!cap) { showToast('Fill all required room fields.','warning'); return; }
  const id = `${block}-${roomNo}`;
  if (state.rooms.find(r=>r.id===id)) { showToast(`Room ${id} already exists!`,'danger'); return; }
  state.rooms.push({ id, block, roomNo, capacity:cap, occupied:0, type, status:'Available', amenities:ams });
  saveState();
  showToast(`Room ${id} added to inventory!`,'success');
  el('addRoomForm').reset();
  el('amenWifi').checked = true;
  el('amenBath').checked = true;
  renderWardenRooms();
}

/* ── Warden Leaves ── */
function renderWardenLeaves() {
  loadState();
  const tbody = el('wardenLeavesBody');
  if (!tbody) return;
  tbody.innerHTML = state.leaves.length
    ? [...state.leaves].reverse().map(l => `
        <tr>
          <td><code style="color:var(--cyan)">${l.id}</code></td>
          <td><strong>${l.studentName}</strong><div style="font-size:0.76rem;color:var(--text-muted)">${l.roomNo}</div></td>
          <td>${l.reason}</td>
          <td>${l.fromDate}</td>
          <td>${l.toDate}</td>
          <td>${statusBadge(l.status)}</td>
          <td>
            ${l.status==='Pending'?`
              <div style="display:flex;flex-direction:column;gap:4px">
                <button class="btn btn-success btn-xs" onclick="processLeave('${l.id}','Approved')"><i class="fas fa-check"></i> Approve</button>
                <button class="btn btn-danger btn-xs" onclick="processLeave('${l.id}','Rejected')"><i class="fas fa-times"></i> Reject</button>
              </div>`
              :`<span style="color:var(--text-muted);font-size:0.78rem">Processed</span>`}
          </td>
        </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:28px">No leave records found.</td></tr>';
}

function processLeave(id, status) {
  loadState();
  const leave = state.leaves.find(l => l.id === id);
  if (!leave) return;
  leave.status  = status;
  leave.remarks = status === 'Approved' ? 'Approved by Warden.' : 'Rejected by Warden.';
  state.notifications.push({ id:genId('NT'), title:`Leave ${status}`, message:`Your leave request (${leave.fromDate} → ${leave.toDate}) has been ${status.toLowerCase()} by the warden.`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`Leave ${status.toLowerCase()} for ${leave.studentName}.`, status==='Approved'?'success':'danger');
  renderWardenLeaves();
}

/* ── Warden Complaints ── */
function renderWardenComplaints() {
  loadState();
  const tbody = el('wardenComplaintsBody');
  if (!tbody) return;
  tbody.innerHTML = state.complaints.length
    ? [...state.complaints].reverse().map(c => `
        <tr>
          <td><code style="color:var(--cyan)">${c.id}</code></td>
          <td><strong>${c.studentName}</strong><div style="font-size:0.76rem;color:var(--text-muted)">${c.roomNo}</div></td>
          <td>${c.category}</td>
          <td style="max-width:180px;font-size:0.82rem">${c.description}</td>
          <td>${c.date}</td>
          <td>${statusBadge(c.status)}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${c.status==='Pending'?`<button class="btn btn-primary btn-xs" onclick="assignTechnicianModal('${c.id}')"><i class="fas fa-user-cog"></i> Assign</button>`:''}
              ${c.status==='In Progress'?`<button class="btn btn-success btn-xs" onclick="resolveComplaint('${c.id}')"><i class="fas fa-check"></i> Resolve</button>`:''}
              ${c.status==='Resolved'?'<span style="color:var(--emerald);font-size:0.78rem">✓ Done</span>':''}
            </div>
          </td>
        </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:28px">No complaints found.</td></tr>';
}

function assignTechnicianModal(complaintId) {
  loadState();
  const c = state.complaints.find(x => x.id === complaintId);
  if (!c) return;
  el('assignComplaintId').value = complaintId;
  el('assignComplaintDetails').innerHTML = `<strong>${c.category}</strong> complaint from <strong>${c.studentName}</strong> (Room ${c.roomNo}):<br><em>${c.description}</em>`;
  el('assignTechName').value = '';
  el('assignModal').classList.add('show');
}
function closeAssignModal() { el('assignModal').classList.remove('show'); el('assignModalForm').reset(); }
function submitTechnicianAssignment(e) {
  e.preventDefault();
  const id   = el('assignComplaintId').value;
  const tech = el('assignTechName').value.trim();
  if (!tech) { showToast('Enter technician name.','warning'); return; }
  const c = state.complaints.find(x => x.id === id);
  if (c) { c.assignedTo = tech; c.status = 'In Progress'; }
  state.notifications.push({ id:genId('NT'), title:'🔧 Technician Assigned', message:`Technician "${tech}" assigned to your ${c.category} complaint (${c.id}).`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`${tech} assigned to complaint ${id}.`,'success');
  closeAssignModal();
  renderWardenComplaints();
}
function resolveComplaint(id) {
  loadState();
  const c = state.complaints.find(x => x.id === id);
  if (!c) return;
  c.status = 'Resolved';
  state.notifications.push({ id:genId('NT'), title:'✅ Complaint Resolved', message:`Your ${c.category} complaint (${c.id}) has been marked as resolved.`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`Complaint ${id} marked as resolved.`,'success');
  renderWardenComplaints();
}

/* ── Warden Fees ── */
function renderWardenFees() {
  loadState();
  const tbody = el('wardenFeesBody');
  if (!tbody) return;
  const sorted = [...state.fees].sort((a,b)=>a.status==='Unpaid'?-1:1);
  tbody.innerHTML = sorted.map(f => `
    <tr>
      <td><code style="color:var(--cyan)">${f.id}</code></td>
      <td><strong>${f.studentName}</strong></td>
      <td>${f.semester}</td>
      <td>₹${fmtMoney(f.totalAmount)}</td>
      <td>${statusBadge(f.status)}</td>
      <td>${f.paidDate||'<span style="color:var(--text-muted)">—</span>'}</td>
      <td>
        ${f.status==='Unpaid'
          ?`<button class="btn btn-success btn-xs" onclick="wardenMarkFeePaid('${f.id}')"><i class="fas fa-check"></i> Mark Paid</button>`
          :`<button class="btn btn-secondary btn-xs" onclick="printInvoice('${f.id}')"><i class="fas fa-file-invoice"></i> Receipt</button>`}
      </td>
    </tr>`).join('');
}
function wardenMarkFeePaid(feeId) {
  loadState();
  const fee = state.fees.find(f => f.id === feeId);
  if (!fee) return;
  if (!confirm(`Mark ${fee.studentName}'s fee as paid?\nAmount: ₹${fmtMoney(fee.totalAmount)}`)) return;
  fee.status    = 'Paid';
  fee.paidAmount= fee.totalAmount;
  fee.paidDate  = getFormattedCurrentTime().slice(0,10);
  fee.receiptId = `RC-${Date.now().toString().slice(-6)}`;
  state.notifications.push({ id:genId('NT'), title:'💳 Fee Marked Paid', message:`${fee.studentName}'s fee of ₹${fmtMoney(fee.totalAmount)} marked paid by warden. Receipt: ${fee.receiptId}`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`Fee for ${fee.studentName} marked as paid. Receipt: ${fee.receiptId}`, 'success');
  renderWardenFees();
}

/* ── Warden Emails ── */
function renderWardenEmails() {
  loadState();
  el('ownerEmail').value    = state.ownerEmail||'';
  el('alertsEnabled').checked = state.emailNotificationsEnabled!==false;
  el('web3Key').value       = state.web3formsKey||'';
  const tbody = el('emailLogsBody');
  if (!tbody) return;
  tbody.innerHTML = state.emailLogs.length
    ? state.emailLogs.map(e => `
        <tr>
          <td><code>${e.id}</code></td>
          <td>${e.timestamp}</td>
          <td style="max-width:200px">${e.subject}</td>
          <td>${e.recipient}</td>
          <td style="max-width:200px;font-size:0.78rem;color:var(--text-secondary)">${String(e.body).substring(0,60)}…</td>
          <td><span class="badge ${e.status.includes('Delivered')||e.status==='Simulated'?'badge-approved':'badge-rejected'}">${e.status}</span></td>
        </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:28px">No email logs yet.</td></tr>';
}
function handleSaveEmailSettings(e) {
  e.preventDefault();
  state.ownerEmail               = el('ownerEmail').value.trim();
  state.emailNotificationsEnabled= el('alertsEnabled').checked;
  state.web3formsKey             = el('web3Key').value.trim();
  saveState();
  showToast('Email settings saved!','success');
}
function triggerTestEmail() {
  sendAutomatedEmail('HMS Pro — Test Notification',`Test notification from HMS Pro.\nTimestamp: ${getFormattedCurrentTime()}\nAll systems operational.`);
  showToast('Test email sent and logged!','info');
  renderWardenEmails();
}

/* ══════════════════════════════════════════════════════════════
   ■ MESS MANAGER PANELS (Full Access)
══════════════════════════════════════════════════════════════ */

/* ── Mess Dashboard ── */
function renderMessDashboard() {
  loadState();
  const ratings    = state.messFeedback.map(f => f.rating);
  const avgRating  = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : '—';
  const today      = getFormattedCurrentTime().slice(0,10);
  const todayAtt   = state.messAttendance.filter(a => a.date === today);
  const activeCount= state.students.filter(s => s.status==='Active').length;
  const skippedB   = todayAtt.filter(a => !a.meals.breakfast).length;
  const skippedL   = todayAtt.filter(a => !a.meals.lunch).length;
  const skippedD   = todayAtt.filter(a => !a.meals.dinner).length;

  el('messStatsGrid').innerHTML =
    statCard('fa-users',    'Total Residents', activeCount,                              'var(--cyan)') +
    statCard('fa-star',     'Avg Rating',      `${avgRating}★`,                         'var(--amber)') +
    statCard('fa-comment',  'Total Reviews',   state.messFeedback.length,                'var(--blue)') +
    statCard('fa-ban',      'Skips Today',     skippedB+skippedL+skippedD,              'var(--rose)');

  // Ratings distribution chart
  const ratingCounts = [1,2,3,4,5].map(r => ratings.filter(x=>x===r).length);
  makeChart('chartMessRatings','bar',
    ['1★','2★','3★','4★','5★'], ratingCounts,
    ['rgba(248,113,113,0.8)','rgba(251,191,36,0.8)','rgba(96,165,250,0.8)','rgba(52,211,153,0.8)','rgba(34,211,238,0.8)']
  );

  // Skip summary
  const skipEl = el('messSkipSummary');
  if (skipEl) {
    skipEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="meal-row"><span class="meal-label">🌅 Breakfast</span><span>${skippedB} skipping / ${activeCount} residents</span></div>
        <div class="meal-row"><span class="meal-label">☀️ Lunch</span><span>${skippedL} skipping / ${activeCount} residents</span></div>
        <div class="meal-row"><span class="meal-label">🌙 Dinner</span><span>${skippedD} skipping / ${activeCount} residents</span></div>
        <div style="margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-muted)">
          <i class="fas fa-calendar"></i> Stats for ${today}
        </div>
      </div>`;
  }
}

/* ── Mess Menu Editor ── */
function renderMessMenuEditor() {
  loadState();
  const dayEl = el('menuDay');
  if (!dayEl) return;
  function loadDay() {
    const day = dayEl.value;
    const m   = state.messMenu[day] || {};
    el('menuBreakfast').value = m.Breakfast || '';
    el('menuLunch').value     = m.Lunch     || '';
    el('menuDinner').value    = m.Dinner    || '';
  }
  dayEl.onchange = loadDay;
  loadDay();
}
function handleSaveMenu(e) {
  e.preventDefault();
  const day  = el('menuDay').value;
  const bk   = el('menuBreakfast').value.trim();
  const ln   = el('menuLunch').value.trim();
  const dn   = el('menuDinner').value.trim();
  if (!bk||!ln||!dn) { showToast('Fill all three meal fields.','warning'); return; }
  state.messMenu[day] = { Breakfast:bk, Lunch:ln, Dinner:dn };
  state.notifications.push({ id:genId('NT'), title:'🍽️ Menu Updated', message:`${day} menu updated by Mess Manager.`, date:getFormattedCurrentTime(), read:false });
  saveState();
  showToast(`${day} menu saved and students notified! ✓`,'success');
}

/* ── Mess Ratings ── */
function renderMessRatings() {
  loadState();
  const container = el('ratingsListContainer');
  if (!container) return;
  if (!state.messFeedback.length) {
    container.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted)"><i class="fas fa-star" style="font-size:3rem;display:block;margin-bottom:12px;opacity:0.3"></i>No ratings submitted yet.</div>';
    return;
  }
  const avg = (state.messFeedback.reduce((a,f)=>a+f.rating,0)/state.messFeedback.length).toFixed(1);
  const dist = [5,4,3,2,1].map(r => ({ r, count:state.messFeedback.filter(f=>f.rating===r).length }));

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:24px;padding:20px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);margin-bottom:20px">
      <div style="text-align:center;min-width:80px">
        <div style="font-size:2.8rem;font-weight:900;color:var(--amber);line-height:1">${avg}</div>
        <div style="color:var(--amber);font-size:1.1rem">${'★'.repeat(Math.round(avg))}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">${state.messFeedback.length} reviews</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">
        ${dist.map(d => `<div style="display:flex;align-items:center;gap:10px;font-size:0.78rem">
          <span style="color:var(--amber);min-width:20px">${d.r}★</span>
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden">
            <div style="height:100%;background:var(--amber);border-radius:99px;width:${state.messFeedback.length?Math.round((d.count/state.messFeedback.length)*100):0}%;transition:width 0.4s"></div>
          </div>
          <span style="color:var(--text-muted);min-width:16px">${d.count}</span>
        </div>`).join('')}
      </div>
    </div>
    ${[...state.messFeedback].reverse().map(f => `
      <div class="rating-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-weight:700">${f.studentName}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--amber);letter-spacing:1px">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</span>
            <span class="badge badge-cyan">${f.rating}/5</span>
          </div>
        </div>
        <div style="font-size:0.875rem;color:var(--text-secondary)">${f.comments||'<em>No comments provided</em>'}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px">${f.date}</div>
      </div>`).join('')}`;
}

/* ══════════════════════════════════════════════════════════════
   ■ GLOBAL WINDOW BINDINGS
══════════════════════════════════════════════════════════════ */
window.navigateToPanel      = navigateToPanel;
window.toggleSidebar        = toggleSidebar;
window.closeSidebar         = closeSidebar;
window.openJoinModal        = openJoinModal;
window.closeJoinModal       = closeJoinModal;
window.bookRoom             = bookRoom;
window.releaseRoom          = releaseRoom;
window.renderStudentBooking = renderStudentBooking;
window.toggleMealSkip       = toggleMealSkip;
window.openFeedbackModal    = openFeedbackModal;
window.closeFeedbackModal   = closeFeedbackModal;
window.openPaymentModal     = openPaymentModal;
window.closePaymentModal    = closePaymentModal;
window.closeInvoiceModal    = closeInvoiceModal;
window.triggerInvoicePrint  = triggerInvoicePrint;
window.printInvoice         = printInvoice;
window.processLeave         = processLeave;
window.rejectAdmission      = rejectAdmission;
window.openAllocateRoomModal  = openAllocateRoomModal;
window.closeAllocateRoomModal = closeAllocateRoomModal;
window.assignTechnicianModal= assignTechnicianModal;
window.closeAssignModal     = closeAssignModal;
window.resolveComplaint     = resolveComplaint;
window.wardenMarkFeePaid    = wardenMarkFeePaid;
window.triggerTestEmail     = triggerTestEmail;

/* ══════════════════════════════════════════════════════════════
   ■ BOOTSTRAP
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Clear old key (migration from old state key to new v4 key)
  // localStorage.removeItem('hms_state'); // Uncomment once to reset

  seedDatabase();
  initAuth();

  // Restore session if still logged in
  if (state.currentUser) setupAppShell();

  /* ── Notifications Bell ── */
  const notifTrigger  = el('notifTrigger');
  const notifDropdown = el('notifDropdown');
  if (notifTrigger && notifDropdown) {
    notifTrigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = notifDropdown.classList.toggle('open');
      if (isOpen) renderNotifList();
    });
    document.addEventListener('click', e => {
      if (notifDropdown && !notifTrigger.contains(e.target)) notifDropdown.classList.remove('open');
    });
  }

  /* ── Mobile Sidebar Overlay ── */
  const overlay = el('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  /* ── Form Bindings ── */
  const bind = (id, fn) => { const f = el(id); if (f) f.addEventListener('submit', fn); };
  bind('joinModalForm',     handleJoinApplication);
  bind('leaveForm',         handleApplyLeave);
  bind('complaintForm',     handleLodgeComplaint);
  bind('messFeedbackForm',  submitMessFeedback);
  bind('paymentModalForm',  handleMockPayment);
  bind('feedbackModalForm', submitComplaintFeedback);
  bind('assignModalForm',   submitTechnicianAssignment);
  bind('allocModalForm',    submitRoomAllocation);
  bind('addStudentForm',    handleAddStudent);
  bind('addRoomForm',       handleAddRoom);
  bind('emailSettingsForm', handleSaveEmailSettings);
  bind('menuEditForm',      handleSaveMenu);

  /* ── Card number auto-format ── */
  const cardNo = el('payCardNo');
  if (cardNo) cardNo.addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'').substring(0,16);
    this.value = v.replace(/(.{4})/g,'$1 ').trim();
  });

  /* ── Expiry auto-format ── */
  const expiry = el('payExpiry');
  if (expiry) expiry.addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'');
    if (v.length > 2) v = v.substring(0,2)+'/'+v.substring(2,4);
    this.value = v;
  });

  /* ── Close modals on backdrop click ── */
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
  });

  /* ── ESC key closes any modal ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      if (notifDropdown) notifDropdown.classList.remove('open');
    }
  });
});
