# CRYPTOSEEK- Cybersecurity Binary Analysis Platform

A modern, responsive web application for advanced binary analysis and cybersecurity threat detection. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Project Overview

 CryptoSeek is a static UI implementation of a cybersecurity platform that enables users to:
- Upload and analyze binary files
- Track analysis jobs in real-time
- View comprehensive security reports
- Understand the analysis pipeline

**Note:** This is the static UI scaffolding. Backend logic, animations, 3D visualizations, and dynamic data will be added in future iterations.

## 📦 Tech Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon system

## 🎨 Design System

The application features a dark cybersecurity theme with:
- **Colors:** Dark backgrounds with cyan/blue accents
- **Typography:** Space Grotesk (display) + Inter (body)
- **Components:** Custom-styled shadcn components
- **Effects:** Cyber-grid patterns, glowing borders, smooth transitions

## 📁 Project Structure

```
/src
  /assets          # Images and static assets (ready for future use)
  /components
    /ui            # shadcn UI components
    Navbar.tsx     # Navigation bar
    Footer.tsx     # Footer component
    NavLink.tsx    # Active route link component
  /pages
    Home.tsx       # Landing page
    HowItWorks.tsx # Pipeline explanation page
    Upload.tsx     # Binary upload interface
    Jobs.tsx       # Analysis dashboard
    NotFound.tsx   # 404 page
  /hooks           # Custom React hooks
  /lib             # Utility functions
  App.tsx          # Main app component with routing
  index.css        # Global styles & design tokens
  main.tsx         # Application entry point
/public            # Static public assets
index.html         # HTML template
tailwind.config.ts # Tailwind configuration
vite.config.ts     # Vite build configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd frontend 
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📄 Pages

### 1. Home / Landing Page (`/`)
- Hero section with CTA
- Feature highlights
- Quick process overview
- Statistics display

### 2. How It Works (`/how-it-works`)
- 4-step analysis pipeline
- Visual step-by-step breakdown
- Technology stack information

### 3. Upload Binary (`/upload`)
- Drag-and-drop file upload
- Hash-based analysis input
- Recent uploads display
- Security information cards

### 4. Analysis Dashboard (`/jobs`)
- Job tracking table
- Status indicators
- Severity badges
- Search and filter UI
- Statistics overview

## 🎯 Features Implemented

✅ Responsive design (mobile, tablet, desktop)  
✅ Dark theme with cybersecurity aesthetic  
✅ Complete navigation system  
✅ Reusable component architecture  
✅ Type-safe TypeScript implementation  
✅ Clean routing with React Router  
✅ Semantic HTML structure  

## 🚧 Planned Enhancements

The following features will be added in future iterations:

- 🎬 **Animations** - GSAP / Framer Motion for smooth transitions
- 🎨 **3D Pipeline Visualization** - react-three-fiber / Three.js
- 📤 **File Upload Logic** - Functional binary upload system
- 🔄 **WebSocket Integration** - Real-time analysis updates
- 🔌 **Backend Integration** - FastAPI connection
- 📊 **Dynamic Data** - Live job tracking and results
- 📈 **Data Visualizations** - Charts and threat graphs

## 🎨 Design Customization

The design system is centralized in:
- `src/index.css` - CSS variables and design tokens
- `tailwind.config.ts` - Tailwind theme configuration

To customize colors, fonts, or spacing, modify these files.

## 📝 Notes

- This is a **static UI** - no backend functionality yet
- All data shown is placeholder/mock data
- File uploads are UI-only (not processed)
- No authentication or user management
- No API calls or data fetching

## 🤝 Contributing

This project is the foundation for a full-stack cybersecurity platform. Contributions are welcome!

## 📧 Contact

For questions or feedback about CRYPTOSEEK, please reach out through the project repository.

---

**Built with ❤️ using React + TypeScript + Tailwind CSS**
