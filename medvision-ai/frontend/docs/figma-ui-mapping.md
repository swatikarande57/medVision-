# MedVision AI — Figma UI to React Mapping

This document establishes the **Visual Design Source of Truth** (Figma UI/UX Design System) mapped directly to the **Functional Source of Truth** (React + TypeScript + Vite codebase).

---

## 🎨 Design Tokens & Design System

- **Primary Background**: High-contrast, deep medical navy `#070b12`
- **Card Surfaces**: Translucent glassmorphism `bg-slate-900/70` with `backdrop-blur-xl` and `border-slate-800/80`
- **Primary Accent**: Medical Cyan `#06b6d4` / `#00f2fe` glow
- **Secondary Accent**: Diagnostic Blue `#3b82f6`
- **Status Colors**:
  - **Critical Anomaly**: Neon Rose `#f43f5e` / `bg-rose-950/80`
  - **Moderate Anomaly**: Amber `#f59e0b` / `bg-amber-950/80`
  - **Normal Findings**: Emerald `#10b981` / `bg-emerald-950/80`
  - **Pending / Queue**: Cyan `#06b6d4`
- **Typography**: Inter / Outfit font family with high-legibility tabular numbers for DICOM coordinates and measurements.

---

## 🗺️ Screen & Component Mapping Table

| Figma Screen Name | React Route | Primary React Component | Reused Design Components | Required Visual & UX Changes |
|---|---|---|---|---|
| **01. Landing Hero** | `/` | `LandingPage.tsx` | `Button`, `Card`, `Badge`, `Medical3DObject` | Refine hero typography, smooth particle background, animated scan-line, feature cards grid, workflow timeline, technology architecture, and dark footer. |
| **02. Authentication** | `/login`, `/register` | `LoginPage.tsx`, `RegisterPage.tsx` | `Button`, `Card`, `Input`, `Select`, `Badge` | Glassmorphic login card, Quick Demo Doctor/Admin access pills, password visibility toggles, role selector, Spring Security JWT badge. |
| **03. Main App Shell** | `/dashboard`, `/patients`, etc. | `Sidebar.tsx`, `TopNav.tsx`, `App.tsx` | `Sidebar`, `TopNav`, `Breadcrumbs`, `Badge` | Expandable/collapsible sidebar with mobile drawer, header global search bar, notification drawer, hospital status badge, smooth layout transitions. |
| **04. Clinical Dashboard** | `/dashboard` | `DashboardPage.tsx` | `Card`, `Button`, `Badge`, `Table`, `LoadingState` | Animated telemetry counters, 7-day Recharts area chart with custom tooltips, recent scans list with anomaly badges, real-time audit logs stream. |
| **05. Patient Directory** | `/patients` | `PatientsPage.tsx` | `Table`, `Button`, `Input`, `Select`, `Badge`, `Modal` | Enhanced data table with hover glow, search & status filters, patient registration modal with field validation. |
| **06. Patient Details** | `/patients/:id` | `PatientDetailsPage.tsx` | `Card`, `Button`, `Badge`, `Table` | Patient demographic summary header, medical record history, scan series chronological timeline cards. |
| **07. DICOM Scan Upload** | `/upload` | `ScanUploadPage.tsx` | `Card`, `Button`, `Select`, `Input`, `Toggle`, `Badge` | Polished drag-and-drop file dropzone (idle, dragging, uploading, success, error states), modality selector, upload progress bar. |
| **08. AI Inference Queue** | Live Upload Action | `ScanUploadPage.tsx` / `AIAnalysisPage.tsx` | `LoadingState`, `Badge` | Animated multi-stage AI processing engine view (Upload → Validation → Preprocessing → Inference → Segmentation → Post-Processing → Completed) with progress ring. |
| **09. AI Lesion Analysis** | `/analysis/:id` | `AIAnalysisPage.tsx` | `Card`, `Button`, `Badge`, `Toggle` | High-res slice viewport, heatmap overlay opacity slider, anomaly confidence cards, lesion volume mm³ metric, radiologist sign-off panel. |
| **10. Medical DICOM Viewer** | `/viewer/:id` | `MedicalViewerPage.tsx` | `Button`, `Select`, `Badge` | Preserve canvas functionality while enhancing surrounding toolbar, windowing presets (Brain, Bone, Lung, Soft Tissue), zoom/pan/invert controls, measurement ruler, DICOM tag header side drawer. |
| **11. Scan Comparison** | `/compare` | `ScanComparisonPage.tsx` | `Card`, `Select`, `Badge`, `Toggle`, `Button` | Dual viewport side-by-side layout, synchronized slice scrolling toggle, lesion volume progression delta (mm³ & % change), AI-assisted longitudinal trend analysis terminology. |
| **12. Diagnostic Reports** | `/reports` | `ReportsPage.tsx` | `Table`, `Modal`, `Button`, `Badge`, `Input` | Report directory, status filters (DRAFT, SIGNED), structured PDF preview modal, radiologist electronic signature sign-off, print & PDF export triggers. |
| **13. System Settings** | `/settings` | `SettingsPage.tsx` | `Card`, `Button`, `Input`, `Select`, `Toggle`, `Badge` | User profile settings, PACS DICOM server nodes (AE Title, Host, Port), AI model sensitivity sliders, JWT session security controls. |
| **14. Shared Components** | Reusable Library | `Breadcrumb.tsx`, `Tooltip.tsx`, `Skeleton.tsx` | All pages | Unified design tokens, keyboard accessibility, smooth 150ms/250ms/400ms micro-animations with `prefers-reduced-motion` support. |

---

## 🛡️ Functional Integrity Rules
1. **Existing Routes**: Preserved without breaking URL structures.
2. **API Services**: Existing `authService.ts` and REST proxy connections preserved.
3. **DICOM Canvas Logic**: High-performance canvas rendering and measurement tools preserved.
