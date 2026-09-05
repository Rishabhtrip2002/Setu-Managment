# SETU SOLUTION CRM & Management System

> Enterprise-grade CRM, Quotation/Invoice Generator, and Lead Management platform tailored for custom software, solar business management, and tracking solutions.

---

## 🚀 Features

- **Lead Pipeline & Conversion**: Complete kanban and list views with multi-channel leads tracking, status progressions, and 1-click conversion to active Clients.
- **Dynamic Serial Number Protocol (`SETU-DDMMYYXXX`)**:
  - Automatic date synchronization (e.g. `SETU-050926059` where `050926` corresponds to `05-09-26` and `059` is the auto-incrementing serial sequence).
  - Dynamic date code update upon changing preparation dates.
  - On-demand `+ Next Serial` generation.
- **Official Quotation & Invoice (Bill) Generator**:
  - Pixel-perfect SETU SOLUTION branded template with official logo placement.
  - Project cost breakdowns, annual maintenance renewal terms, and 7 standard contract terms.
  - Standalone A4 Print / PDF exporter with zero-clipping layout.
  - Direct JSON format export and storage inside Lead objects.
- **Payment Schedules & WhatsApp Automation**:
  - Multi-instalment payment plans with due date tracking.
  - Automated WhatsApp payment reminders and communication logs.
- **Modern UI / UX**:
  - Dark-mode luxury aesthetics with Tailwind CSS, Lucide icons, glassmorphic cards, and micro-interactions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React
- **Architecture**: Single-tree modular structure with centralized CRM State Context (`CRMContext.jsx`)
- **Storage**: LocalStorage engine with automatic migration for legacy document IDs.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Run

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App will run at `http://localhost:5173`.

### Production Build

```bash
cd frontend
npm run build
```

---

## 🏢 Company Details
- **Company**: SETU SOLUTION
- **Address**: Naka No. 10, Revti Complex, Nagpur, 440023
- **Contact**: +91 7517913795 / +91 9834856749
- **Email**: official@setusolution.in
- **Website**: [https://setusolution.in/](https://setusolution.in/)
