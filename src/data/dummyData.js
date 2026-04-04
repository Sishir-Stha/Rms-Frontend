// ============================================================
// REPAIR & DEVICE MANAGEMENT SYSTEM - DUMMY DATA
// ============================================================

export const USERS = [
  { id: 1, name: 'System User', email: 'user@repairms.com', department: 'IT', status: 'Active', avatar: 'SU', joinDate: '2023-01-15' },
  { id: 2, name: 'Sarah Mitchell', email: 'sarah.m@repairms.com', department: 'IT', status: 'Active', avatar: 'SM', joinDate: '2023-03-20' },
  { id: 3, name: 'James Rodriguez', email: 'james.r@repairms.com', department: 'IT', status: 'Active', avatar: 'JR', joinDate: '2023-05-10' },
  { id: 4, name: 'Emily Chen', email: 'emily.c@repairms.com', department: 'Finance', status: 'Active', avatar: 'EC', joinDate: '2023-06-01' },
  { id: 5, name: 'Michael Torres', email: 'michael.t@repairms.com', department: 'IT', status: 'Active', avatar: 'MT', joinDate: '2023-07-15' },
  { id: 6, name: 'Lisa Park', email: 'lisa.p@repairms.com', department: 'HR', status: 'Active', avatar: 'LP', joinDate: '2023-08-20' },
  { id: 7, name: 'David Kim', email: 'david.k@repairms.com', department: 'IT', status: 'Active', avatar: 'DK', joinDate: '2023-09-05' },
  { id: 8, name: 'Priya Patel', email: 'priya.p@repairms.com', department: 'Operations', status: 'Active', avatar: 'PP', joinDate: '2024-01-10' },
]

export const VENDORS = [
  { id: 1, name: 'TechFix Solutions', contact: 'techfix@vendor.com', phone: '+977-1-4411234', specialization: 'Laptops & Desktops', rating: 4.8 },
  { id: 2, name: 'QuickRepair Co.', contact: 'quick@repairco.com', phone: '+977-1-4422345', specialization: 'Mobile Devices', rating: 4.5 },
  { id: 3, name: 'Elite Tech Services', contact: 'elite@techserv.com', phone: '+977-1-4433456', specialization: 'Printers & Peripherals', rating: 4.7 },
  { id: 4, name: 'ProMend Systems', contact: 'promend@sys.com', phone: '+977-1-4444567', specialization: 'Servers & Network', rating: 4.9 },
  { id: 5, name: 'Swift Tech Nepal', contact: 'swift@technepal.com', phone: '+977-1-4455678', specialization: 'All Devices', rating: 4.3 },
]

export const DEPARTMENTS = [
  { id: 1, name: 'Information Technology', code: 'IT', headCount: 15 },
  { id: 2, name: 'Finance', code: 'FIN', headCount: 22 },
  { id: 3, name: 'Human Resources', code: 'HR', headCount: 8 },
  { id: 4, name: 'Operations', code: 'OPS', headCount: 35 },
  { id: 5, name: 'Marketing', code: 'MKT', headCount: 12 },
  { id: 6, name: 'Sales', code: 'SLS', headCount: 28 },
  { id: 7, name: 'Legal', code: 'LEG', headCount: 6 },
  { id: 8, name: 'Research & Development', code: 'R&D', headCount: 18 },
]

export const DEVICE_CATEGORIES = [
  { id: 1, name: 'Laptops', description: 'Portable computers and notebooks', icon: '💻', count: 48 },
  { id: 2, name: 'Desktops', description: 'Workstation computers', icon: '🖥️', count: 32 },
  { id: 3, name: 'Mobile Phones', description: 'Smartphones and mobile devices', icon: '📱', count: 25 },
  { id: 4, name: 'Printers', description: 'Inkjet and laser printers', icon: '🖨️', count: 18 },
  { id: 5, name: 'Monitors', description: 'Display screens', icon: '🖥', count: 40 },
  { id: 6, name: 'Tablets', description: 'iPad and Android tablets', icon: '📟', count: 12 },
  { id: 7, name: 'Network Equipment', description: 'Routers, switches, modems', icon: '🔌', count: 22 },
  { id: 8, name: 'Servers', description: 'Physical and virtual servers', icon: '🗄️', count: 6 },
]

export const REPAIRS = [
  { id: 'REP-001', device: 'Dell Inspiron 15', deviceCategory: 'Laptops', issue: 'Battery not charging, powers off unexpectedly', reportedBy: 'Emily Chen', reportedDate: '2026-03-01', technician: 'James Rodriguez', vendor: 'TechFix Solutions', status: 'Completed', priority: 'High', expectedCompletion: '2026-03-08', resolvedDate: '2026-03-07', cost: 4500, serialNo: 'SN-DL15-2023-001', department: 'Finance', kanbanColumn: 'Completed' },
  { id: 'REP-002', device: 'HP LaserJet Pro', deviceCategory: 'Printers', issue: 'Paper jam and print quality issues', reportedBy: 'Lisa Park', reportedDate: '2026-03-03', technician: 'Michael Torres', vendor: 'Elite Tech Services', status: 'In Progress', priority: 'Medium', expectedCompletion: '2026-03-25', resolvedDate: null, cost: 2200, serialNo: 'SN-HP-PRN-045', department: 'HR', kanbanColumn: 'In Progress' },
  { id: 'REP-003', device: 'Lenovo ThinkPad X1', deviceCategory: 'Laptops', issue: 'Screen flickering and display artifacts', reportedBy: 'David Kim', reportedDate: '2026-03-05', technician: 'Sarah Mitchell', vendor: 'TechFix Solutions', status: 'Pending', priority: 'High', expectedCompletion: '2026-03-27', resolvedDate: null, cost: 0, serialNo: 'SN-LN-TP-X1-089', department: 'IT', kanbanColumn: 'Backlog' },
  { id: 'REP-004', device: 'iPhone 14 Pro', deviceCategory: 'Mobile Phones', issue: 'Cracked screen and touch not responding', reportedBy: 'Priya Patel', reportedDate: '2026-03-06', technician: 'James Rodriguez', vendor: 'QuickRepair Co.', status: 'Under Review', priority: 'Low', expectedCompletion: '2026-03-28', resolvedDate: null, cost: 8500, serialNo: 'SN-IP14P-2024-021', department: 'Operations', kanbanColumn: 'Under Review' },
  { id: 'REP-005', device: 'Canon PIXMA', deviceCategory: 'Printers', issue: 'Ink cartridge error and color distortion', reportedBy: 'Emily Chen', reportedDate: '2026-03-07', technician: 'Michael Torres', vendor: 'Elite Tech Services', status: 'Completed', priority: 'Low', expectedCompletion: '2026-03-14', resolvedDate: '2026-03-12', cost: 1800, serialNo: 'SN-CN-PIX-033', department: 'Finance', kanbanColumn: 'Completed' },
  { id: 'REP-006', device: 'Dell OptiPlex 7090', deviceCategory: 'Desktops', issue: 'No POST, system not booting at all', reportedBy: 'Michael Torres', reportedDate: '2026-03-08', technician: 'David Kim', vendor: 'ProMend Systems', status: 'In Progress', priority: 'Critical', expectedCompletion: '2026-03-22', resolvedDate: null, cost: 0, serialNo: 'SN-DL-OPT-7090-012', department: 'IT', kanbanColumn: 'In Progress' },
  { id: 'REP-007', device: 'MacBook Pro 16"', deviceCategory: 'Laptops', issue: 'Keyboard keys not responding, spill damage', reportedBy: 'Sarah Mitchell', reportedDate: '2026-03-09', technician: 'James Rodriguez', vendor: 'TechFix Solutions', status: 'Pending', priority: 'High', expectedCompletion: '2026-03-30', resolvedDate: null, cost: 0, serialNo: 'SN-MB-PRO16-2023-007', department: 'IT', kanbanColumn: 'Backlog' },
  { id: 'REP-008', device: 'Samsung Galaxy S23', deviceCategory: 'Mobile Phones', issue: 'Overheating during calls and charging', reportedBy: 'Lisa Park', reportedDate: '2026-03-10', technician: 'Sarah Mitchell', vendor: 'QuickRepair Co.', status: 'Completed', priority: 'Medium', expectedCompletion: '2026-03-17', resolvedDate: '2026-03-16', cost: 3200, serialNo: 'SN-SG-S23-2024-034', department: 'HR', kanbanColumn: 'Completed' },
  { id: 'REP-009', device: 'Cisco Catalyst 2960', deviceCategory: 'Network Equipment', issue: 'Port failure, network connectivity loss', reportedBy: 'David Kim', reportedDate: '2026-03-11', technician: 'David Kim', vendor: 'ProMend Systems', status: 'Under Review', priority: 'Critical', expectedCompletion: '2026-03-23', resolvedDate: null, cost: 0, serialNo: 'SN-CSC-2960-009', department: 'IT', kanbanColumn: 'Under Review' },
  { id: 'REP-010', device: 'Epson WorkForce', deviceCategory: 'Printers', issue: 'Scanner malfunction and feed errors', reportedBy: 'Priya Patel', reportedDate: '2026-03-12', technician: 'Michael Torres', vendor: 'Elite Tech Services', status: 'In Progress', priority: 'Low', expectedCompletion: '2026-03-29', resolvedDate: null, cost: 0, serialNo: 'SN-EP-WF-056', department: 'Operations', kanbanColumn: 'In Progress' },
  { id: 'REP-011', device: 'HP EliteBook 840', deviceCategory: 'Laptops', issue: 'Windows update failure, blue screen errors', reportedBy: 'Emily Chen', reportedDate: '2026-03-13', technician: 'Sarah Mitchell', vendor: 'TechFix Solutions', status: 'Completed', priority: 'Medium', expectedCompletion: '2026-03-20', resolvedDate: '2026-03-19', cost: 2000, serialNo: 'SN-HP-EB-840-078', department: 'Finance', kanbanColumn: 'Completed' },
  { id: 'REP-012', device: 'Dell UltraSharp 27"', deviceCategory: 'Monitors', issue: 'Dead pixels and backlight bleeding', reportedBy: 'David Kim', reportedDate: '2026-03-14', technician: 'James Rodriguez', vendor: 'TechFix Solutions', status: 'Pending', priority: 'Low', expectedCompletion: '2026-04-01', resolvedDate: null, cost: 0, serialNo: 'SN-DL-US27-2024-011', department: 'IT', kanbanColumn: 'Backlog' },
  { id: 'REP-013', device: 'Asus ROG Strix', deviceCategory: 'Laptops', issue: 'GPU overheating, thermal throttling', reportedBy: 'Michael Torres', reportedDate: '2026-03-15', technician: 'James Rodriguez', vendor: 'TechFix Solutions', status: 'In Progress', priority: 'High', expectedCompletion: '2026-03-28', resolvedDate: null, cost: 0, serialNo: 'SN-AS-ROG-013', department: 'IT', kanbanColumn: 'In Progress' },
  { id: 'REP-014', device: 'Logitech MX Master', deviceCategory: 'Network Equipment', issue: 'Scroll wheel not working, buttons unresponsive', reportedBy: 'Lisa Park', reportedDate: '2026-03-16', technician: 'Michael Torres', vendor: 'Swift Tech Nepal', status: 'Completed', priority: 'Low', expectedCompletion: '2026-03-18', resolvedDate: '2026-03-17', cost: 800, serialNo: 'SN-LG-MX-2024-022', department: 'HR', kanbanColumn: 'Completed' },
  { id: 'REP-015', device: 'iPad Pro 12.9"', deviceCategory: 'Tablets', issue: 'Charging port damaged, not syncing', reportedBy: 'Priya Patel', reportedDate: '2026-03-17', technician: 'Sarah Mitchell', vendor: 'QuickRepair Co.', status: 'Pending', priority: 'Medium', expectedCompletion: '2026-04-02', resolvedDate: null, cost: 0, serialNo: 'SN-IPD-PRO129-019', department: 'Operations', kanbanColumn: 'Backlog' },
  { id: 'REP-016', device: 'Lenovo IdeaPad 3', deviceCategory: 'Laptops', issue: 'RAM failure, frequent random crashes', reportedBy: 'Emily Chen', reportedDate: '2026-03-18', technician: 'James Rodriguez', vendor: 'TechFix Solutions', status: 'Under Review', priority: 'High', expectedCompletion: '2026-03-29', resolvedDate: null, cost: 0, serialNo: 'SN-LN-IP3-2024-041', department: 'Finance', kanbanColumn: 'Under Review' },
  { id: 'REP-017', device: 'Brother MFC-L8900', deviceCategory: 'Printers', issue: 'Fuser error, paper not feeding correctly', reportedBy: 'Lisa Park', reportedDate: '2026-03-19', technician: 'Michael Torres', vendor: 'Elite Tech Services', status: 'In Progress', priority: 'Medium', expectedCompletion: '2026-03-30', resolvedDate: null, cost: 0, serialNo: 'SN-BR-MFC-L8-028', department: 'HR', kanbanColumn: 'In Progress' },
  { id: 'REP-018', device: 'HP Pavilion 15', deviceCategory: 'Laptops', issue: 'Touchpad clicking but cursor not moving', reportedBy: 'David Kim', reportedDate: '2026-03-20', technician: 'Sarah Mitchell', vendor: 'TechFix Solutions', status: 'Pending', priority: 'Low', expectedCompletion: '2026-04-05', resolvedDate: null, cost: 0, serialNo: 'SN-HP-PAV15-052', department: 'IT', kanbanColumn: 'Backlog' },
  { id: 'REP-019', device: 'Cisco IP Phone 7942', deviceCategory: 'Network Equipment', issue: 'No dial tone, voice quality issues', reportedBy: 'Michael Torres', reportedDate: '2026-03-21', technician: 'David Kim', vendor: 'ProMend Systems', status: 'Pending', priority: 'High', expectedCompletion: '2026-04-03', resolvedDate: null, cost: 0, serialNo: 'SN-CSC-7942-015', department: 'IT', kanbanColumn: 'Backlog' },
  { id: 'REP-020', device: 'Samsung Galaxy Tab', deviceCategory: 'Tablets', issue: 'App crashes, insufficient storage error', reportedBy: 'Priya Patel', reportedDate: '2026-03-22', technician: 'James Rodriguez', vendor: 'QuickRepair Co.', status: 'Completed', priority: 'Low', expectedCompletion: '2026-03-25', resolvedDate: '2026-03-22', cost: 1500, serialNo: 'SN-SG-TAB-2024-031', department: 'Operations', kanbanColumn: 'Completed' },
]

export const DEVICE_REQUESTS = [
  { id: 'REQ-001', requestedBy: 'Emily Chen', department: 'Finance', deviceType: 'Laptop', brand: 'Dell XPS 15', reason: 'Current laptop is 5 years old and too slow for accounting software', requestDate: '2026-03-01', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-05', priority: 'High', kanbanColumn: 'Approved' },
  { id: 'REQ-002', requestedBy: 'Lisa Park', department: 'HR', deviceType: 'Desktop', brand: 'HP EliteDesk', reason: 'New employee workstation requirement', requestDate: '2026-03-03', approvalStatus: 'Pending', approvedBy: null, approvalDate: null, priority: 'Medium', kanbanColumn: 'Pending' },
  { id: 'REQ-003', requestedBy: 'Priya Patel', department: 'Operations', deviceType: 'Mobile Phone', brand: 'iPhone 15', reason: 'Field work requires mobile connectivity for operations management', requestDate: '2026-03-05', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-08', priority: 'High', kanbanColumn: 'Approved' },
  { id: 'REQ-004', requestedBy: 'Marketing Team', department: 'Marketing', deviceType: 'Tablet', brand: 'iPad Pro', reason: 'Presentations and client demos require portable display', requestDate: '2026-03-07', approvalStatus: 'Rejected', approvedBy: 'Admin User', approvalDate: '2026-03-10', priority: 'Low', kanbanColumn: 'Rejected' },
  { id: 'REQ-005', requestedBy: 'David Kim', department: 'IT', deviceType: 'Server', brand: 'Dell PowerEdge R750', reason: 'Expanding infrastructure for new cloud migration project', requestDate: '2026-03-08', approvalStatus: 'Pending', approvedBy: null, approvalDate: null, priority: 'Critical', kanbanColumn: 'Pending' },
  { id: 'REQ-006', requestedBy: 'Sales Team Lead', department: 'Sales', deviceType: 'Laptop', brand: 'Lenovo ThinkPad', reason: 'Remote sales team needs updated portable workstations', requestDate: '2026-03-09', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-12', priority: 'Medium', kanbanColumn: 'Approved' },
  { id: 'REQ-007', requestedBy: 'Legal Department', department: 'Legal', deviceType: 'Printer', brand: 'HP LaserJet Enterprise', reason: 'High-volume document printing for case management', requestDate: '2026-03-10', approvalStatus: 'Pending', approvedBy: null, approvalDate: null, priority: 'Medium', kanbanColumn: 'Pending' },
  { id: 'REQ-008', requestedBy: 'R&D Team', department: 'Research & Development', deviceType: 'Workstation', brand: 'HP Z8 G4', reason: 'High-performance computing for simulation and data analysis', requestDate: '2026-03-11', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-14', priority: 'High', kanbanColumn: 'Approved' },
  { id: 'REQ-009', requestedBy: 'Michael Torres', department: 'IT', deviceType: 'Network Switch', brand: 'Cisco Catalyst 9200', reason: 'Network expansion for new office floor build-out', requestDate: '2026-03-12', approvalStatus: 'Rejected', approvedBy: 'Admin User', approvalDate: '2026-03-15', priority: 'High', kanbanColumn: 'Rejected' },
  { id: 'REQ-010', requestedBy: 'Sarah Mitchell', department: 'IT', deviceType: 'Laptop', brand: 'MacBook Pro M3', reason: 'Development workstation upgrade for improved build times', requestDate: '2026-03-13', approvalStatus: 'Pending', approvedBy: null, approvalDate: null, priority: 'Medium', kanbanColumn: 'Pending' },
  { id: 'REQ-011', requestedBy: 'Finance Director', department: 'Finance', deviceType: 'Monitor', brand: 'Dell UltraSharp 32"', reason: 'Dual monitor setup for financial reporting workspace', requestDate: '2026-03-14', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-17', priority: 'Low', kanbanColumn: 'Approved' },
  { id: 'REQ-012', requestedBy: 'Operations Manager', department: 'Operations', deviceType: 'Scanner', brand: 'Fujitsu ScanSnap', reason: 'Document digitization project requires high-speed scanner', requestDate: '2026-03-15', approvalStatus: 'Pending', approvedBy: null, approvalDate: null, priority: 'Low', kanbanColumn: 'Pending' },
  { id: 'REQ-013', requestedBy: 'HR Manager', department: 'HR', deviceType: 'Laptop', brand: 'Asus ZenBook', reason: 'Remote HR interviews and onboarding sessions', requestDate: '2026-03-16', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-19', priority: 'Medium', kanbanColumn: 'Approved' },
  { id: 'REQ-014', requestedBy: 'Marketing Lead', department: 'Marketing', deviceType: 'Camera', brand: 'Sony Alpha A7 IV', reason: 'Product photography and marketing content creation', requestDate: '2026-03-17', approvalStatus: 'Rejected', approvedBy: 'Admin User', approvalDate: '2026-03-20', priority: 'Low', kanbanColumn: 'Rejected' },
  { id: 'REQ-015', requestedBy: 'James Rodriguez', department: 'IT', deviceType: 'Tool Kit', brand: 'iFixit Pro Tech', reason: 'Repair technician tools for field service work', requestDate: '2026-03-18', approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: '2026-03-20', priority: 'Medium', kanbanColumn: 'Approved' },
]

export const SUPPORT_TICKETS = [
  { id: 'TKT-001', title: 'Cannot connect to VPN', description: 'Unable to establish VPN connection from home. Getting error code 800.', raisedBy: 'Emily Chen', department: 'Finance', priority: 'High', status: 'Open', assignedTo: 'Sarah Mitchell', category: 'Network', createdDate: '2026-03-10', updatedDate: '2026-03-10' },
  { id: 'TKT-002', title: 'Email not syncing on phone', description: 'Outlook app on iPhone is not syncing new emails automatically.', raisedBy: 'Lisa Park', department: 'HR', priority: 'Medium', status: 'In Progress', assignedTo: 'James Rodriguez', category: 'Email', createdDate: '2026-03-11', updatedDate: '2026-03-12' },
  { id: 'TKT-003', title: 'Software license expired', description: 'Adobe Acrobat license has expired. Need renewal for document work.', raisedBy: 'Priya Patel', department: 'Operations', priority: 'Low', status: 'Resolved', assignedTo: 'David Kim', category: 'Software', createdDate: '2026-03-08', updatedDate: '2026-03-09' },
  { id: 'TKT-004', title: 'Printer spooling error', description: 'Print jobs are stuck in queue. Tried restarting, issue persists.', raisedBy: 'Finance Department', department: 'Finance', priority: 'Medium', status: 'Open', assignedTo: 'Michael Torres', category: 'Hardware', createdDate: '2026-03-12', updatedDate: '2026-03-12' },
  { id: 'TKT-005', title: 'Access denied to shared drive', description: 'Cannot access the Projects shared drive after password reset.', raisedBy: 'Marketing Team', department: 'Marketing', priority: 'High', status: 'In Progress', assignedTo: 'Sarah Mitchell', category: 'Access', createdDate: '2026-03-13', updatedDate: '2026-03-14' },
  { id: 'TKT-006', title: 'Slow internet on 3rd floor', description: 'Internet speed is extremely slow on the 3rd floor office area since Monday.', raisedBy: 'Sales Team', department: 'Sales', priority: 'High', status: 'Resolved', assignedTo: 'David Kim', category: 'Network', createdDate: '2026-03-09', updatedDate: '2026-03-11' },
  { id: 'TKT-007', title: 'New employee account setup', description: 'Need to create accounts for 3 new employees joining on Monday.', raisedBy: 'HR Manager', department: 'HR', priority: 'Critical', status: 'Open', assignedTo: 'David Kim', category: 'User Management', createdDate: '2026-03-14', updatedDate: '2026-03-14' },
  { id: 'TKT-008', title: 'Zoom not working on laptop', description: 'Camera and microphone not detected by Zoom during video calls.', raisedBy: 'Operations Manager', department: 'Operations', priority: 'Medium', status: 'Resolved', assignedTo: 'James Rodriguez', category: 'Software', createdDate: '2026-03-07', updatedDate: '2026-03-08' },
  { id: 'TKT-009', title: 'Data backup failure alert', description: 'Automated backup failed last night. Received alert email from backup system.', raisedBy: 'David Kim', department: 'IT', priority: 'Critical', status: 'In Progress', assignedTo: 'David Kim', category: 'Infrastructure', createdDate: '2026-03-15', updatedDate: '2026-03-15' },
  { id: 'TKT-010', title: 'Monitor not detected', description: 'Second monitor not recognized by Dell laptop. Tried different cable.', raisedBy: 'Legal Department', department: 'Legal', priority: 'Low', status: 'Open', assignedTo: 'Michael Torres', category: 'Hardware', createdDate: '2026-03-16', updatedDate: '2026-03-16' },
]

export const MONTHLY_REPAIRS = [
  { month: 'Apr 25', repairs: 18, completed: 14, pending: 4 },
  { month: 'May 25', repairs: 22, completed: 19, pending: 3 },
  { month: 'Jun 25', repairs: 15, completed: 12, pending: 3 },
  { month: 'Jul 25', repairs: 28, completed: 24, pending: 4 },
  { month: 'Aug 25', repairs: 24, completed: 20, pending: 4 },
  { month: 'Sep 25', repairs: 32, completed: 28, pending: 4 },
  { month: 'Oct 25', repairs: 20, completed: 17, pending: 3 },
  { month: 'Nov 25', repairs: 26, completed: 22, pending: 4 },
  { month: 'Dec 25', repairs: 14, completed: 12, pending: 2 },
  { month: 'Jan 26', repairs: 30, completed: 25, pending: 5 },
  { month: 'Feb 26', repairs: 35, completed: 29, pending: 6 },
  { month: 'Mar 26', repairs: 28, completed: 18, pending: 10 },
]

export const DEVICE_CATEGORY_DATA = [
  { name: 'Laptops', value: 40, fill: '#62df7d' },
  { name: 'Mobile Phones', value: 25, fill: '#adc6ff' },
  { name: 'Printers', value: 20, fill: '#f59e0b' },
  { name: 'Desktops', value: 10, fill: '#bac5ee' },
  { name: 'Others', value: 5, fill: '#879485' },
]

export const DEPARTMENT_REQUESTS_DATA = [
  { dept: 'IT', requests: 15, approved: 10, rejected: 3, pending: 2 },
  { dept: 'Finance', requests: 12, approved: 9, rejected: 1, pending: 2 },
  { dept: 'HR', requests: 8, approved: 6, rejected: 1, pending: 1 },
  { dept: 'Operations', requests: 18, approved: 12, rejected: 2, pending: 4 },
  { dept: 'Marketing', requests: 6, approved: 3, rejected: 2, pending: 1 },
  { dept: 'Sales', requests: 10, approved: 8, rejected: 1, pending: 1 },
  { dept: 'Legal', requests: 4, approved: 3, rejected: 0, pending: 1 },
  { dept: 'R&D', requests: 9, approved: 7, rejected: 1, pending: 1 },
]

export const TECHNICIAN_PERFORMANCE = [
  { name: 'James Rodriguez', resolved: 34, inProgress: 5, avgDays: 3.2, rating: 4.8 },
  { name: 'Sarah Mitchell', resolved: 28, inProgress: 4, avgDays: 2.8, rating: 4.9 },
  { name: 'Michael Torres', resolved: 31, inProgress: 6, avgDays: 3.5, rating: 4.6 },
  { name: 'David Kim', resolved: 22, inProgress: 3, avgDays: 4.1, rating: 4.5 },
]

export const DASHBOARD_METRICS = {
  totalRepairs: 142,
  pendingRepairs: 28,
  deviceRequests: 65,
  resolvedToday: 12,
  totalRepairsTrend: +8.3,
  pendingTrend: -4.2,
  requestsTrend: +12.5,
  resolvedTrend: +20.0,
}

export const ASSETS = [
  { id: 'AST-001', name: 'Dell Inspiron Series', category: 'Laptops', count: 18, avgAge: '2.3 yrs', condition: 'Good', nextMaint: '2026-06-01' },
  { id: 'AST-002', name: 'HP LaserJet Pro Series', category: 'Printers', count: 8, avgAge: '3.1 yrs', condition: 'Fair', nextMaint: '2026-04-15' },
  { id: 'AST-003', name: 'iPhone Fleet', category: 'Mobile Phones', count: 12, avgAge: '1.5 yrs', condition: 'Excellent', nextMaint: '2026-08-01' },
  { id: 'AST-004', name: 'Cisco Network Equipment', category: 'Network', count: 22, avgAge: '4.2 yrs', condition: 'Poor', nextMaint: '2026-03-30' },
  { id: 'AST-005', name: 'Dell OptiPlex Desktops', category: 'Desktops', count: 15, avgAge: '2.8 yrs', condition: 'Good', nextMaint: '2026-05-20' },
  { id: 'AST-006', name: 'Samsung Galaxy Tabs', category: 'Tablets', count: 6, avgAge: '1.2 yrs', condition: 'Excellent', nextMaint: '2026-09-01' },
]
