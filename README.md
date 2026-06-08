
Project Overview
- This is a full-stack Hospital Management System called MedCare, built with React on the frontend and Node.js on the backend, connected to a MongoDB database.

User Roles
- There are five roles in the system: Admin, Doctor, Patient, Lab Staff, and Pharmacy Staff — each with their own dashboard and login.
- Role-based routing is handled on login, directing each user to their specific dashboard page automatically.

Login Page
- The login page has a split-panel design with a purple gradient left panel showing features and a white card right panel for the form.
- It collects First Name, Last Name, Email, Password, and Role (as pill buttons), with a Remember Me checkbox and Forgot Password section.
- All login logic calls `POST /api/user/login` with email, password, and role, then saves the full user object (including `_id`) to `localStorage` under the key `loginData`.

Signup Page
- New users register via `POST /api/user/signup` with firstname, middlename, lastname, email, phone, password, and role.

Backend Structure
- The backend uses Express 4 (not 5) because Express 5 causes a "next is not a function" error that breaks all routes.
- The server entry point is `server.js` and it mounts all routes under the `/api/` prefix.
- MongoDB is connected using Mongoose with the connection string stored in a `.env` file as `MONGO_URL`.
- All routes follow the pattern: `/api/user`, `/api/appointment`, `/api/patient`, `/api/admin`, `/api/pharmacy`, `/api/labtest`, `/api/lab` (alias), `/api/prescription`, `/api/report`, `/api/emergency`.

Models 
- `UserModals` — stores all users (doctors, patients, staff, admin) with role field; phone and firstname/lastname are required.
- `AppointmentModal` — stores appointments with `patientId` (ObjectId ref), `doctorId` (ObjectId ref), `patientName`, `doctorName`, `department`, `date`, `time`, `notes`, `status`.
- `LabTestModals` — stores lab tests with optional `patientId` ObjectId or plain `patientName` string, `testName`, `priority`, `status`, `report`, `remarks`, `emergency`.
- `EquipmentModal` — stores lab equipment with `name`, `status`, `lastMaintenance`; seeded with 6 defaults on first run.
- `Bill` — stores pharmacy bills with `patientName`, `medicine`, `amount`, `totalAmount`, `paymentMethod`, `status`.
- `Medicine` — stores medicines with `medicineName`, `quantity`, `supplier`.
- `Supplier` — stores suppliers with `name`, `phone`, `medicine`.
- `PrescriptionModal` — stores prescriptions with `patient` (string name), `phone`, `doctor`, `medicine`, `notes`, `status`.
- `ReportModal` — stores doctor-created reports with `patient` (string name), `phone`, `doctor`, `diagnosis`, `notes`, `status`; this is separate from Prescription.
- `EmergencyModal` — stores emergency cases.

Admin Dashboard
- Admin can view stats (total doctors, patients, staff, revenue) fetched from `/api/admin/stats`.
- Admin can add and delete doctors via `POST /api/admin/doctors` and `DELETE /api/admin/doctors/:id`, and edit them via `PUT /api/admin/doctors/:id` using `$set` with `runValidators: false` to bypass required-field validation on updates.
- Admin can add and delete staff via `POST /api/admin/staff` and `DELETE /api/admin/staff/:id`, and edit via `PUT /api/admin/staff/:id`.
- Admin has pages for Bills (shows all pharmacy bills with revenue summary), Departments (14 departments with doctor assignments), and Reports (doctor reports + lab test reports).
- Admin navbar has Home, Profile, Notifications, and Logout buttons.

Doctor Dashboard
- Doctor reads their own info from `localStorage.getItem("loginData")` — this must be declared before any `useState` that references it (to avoid "cannot access before initialization" error).
- Doctor sees only their own appointments, filtered by matching `doctorId` from the appointments list.
- Doctor can create reports saved to `/api/report/create` (the Report collection, not Prescription).
- Doctor can view all saved reports from `/api/report/all` in the "View Reports" tab.
- Doctor can see all lab tests from `/api/labtest/tests` in the "Lab Tests" tab.
- Doctor has edit modals for appointments (date, time, status, notes) and for saved reports (patient, diagnosis, notes) — these modals must be placed inside the JSX `return()` fragment, not outside the function.
- Doctor navbar has Home, Profile, Notifications, and Logout buttons.

Patient Dashboard
- Patient books appointments by calling `POST /api/patient/appointments/book` with `patientId` (the `_id` from localStorage), `doctorId`, `doctorName`, `department`, `date`, `time`, `notes`.
- Patient views their appointments by calling `GET /api/patient/appointments/:id`.
- Patient can see their Medical Reports by fetching all reports and filtering loosely by firstname — if no match, all records are shown.
- Patient can see their Prescriptions from `/api/prescription/all`, filtered by firstname.
- Patient can see their Pharmacy Bills from `/api/pharmacy/bills`, filtered by firstname.

Lab Staff Dashboard
- Lab staff can create test orders manually (no patient dropdown — just type patient name and test name) via `POST /api/labtest/tests`.
- Lab staff can upload test results manually via `PUT /api/labtest/report/:id`, or create a new completed test directly if no existing test ID is selected.
- Equipment is stored in MongoDB; lab staff can add equipment via `POST /api/labtest/equipment`, delete via `DELETE /api/labtest/equipment/:id`, and edit via `PUT /api/labtest/equipment/:id`.
- Lab staff navbar has Home, Profile, Notifications, and Logout buttons.

Pharmacy Staff Dashboard
- Pharmacy staff can create bills via `POST /api/pharmacy/bills` with patientName, medicine (from medicines array), totalAmount, and paymentMethod.
- Pharmacy staff can add, edit, and delete medicines, suppliers, and bills.
- Edit modals exist for medicines (medicineName, quantity, supplier), suppliers (name, phone, medicine), and bills (patientName, amount, status).

Frontend Data Fetching Pattern
- All pages use `axios` with base URL `http://localhost:5000/api`.
- Responses from the backend use dual-format: `{ success, data: [...], namedKey: [...] }` so both `res.data.data` and `res.data.namedKey` work.
- The `useFetch` hook in Admin checks multiple response shapes: `r?.data`, `r?.doctors`, `r?.patients`, etc., falling back to the raw response.

Homepage (Landing Page)
- The hero section has an animated typewriter effect cycling through 5 sentences with a blinking cursor using `useEffect` and `useState`.
- The footer Terms & Condition link smoothly scrolls to the `#terms` section using `scrollIntoView({ behavior: "smooth" })`.

Running the Project
- Start the backend with `cd backend && npm install && npm start` (port 5000).
- Start the frontend with `cd MFD-output && npm install && npm start` (port 3000).
