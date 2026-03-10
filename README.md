# Apex Global Bank - Multimodal Concierge

An advanced, multimodal AI banking assistant built with the Gemini Live API. This application provides a high-end, cinematic banking experience featuring real-time voice interaction, computer vision, and AI-generated financial visualizations.

## 🏗 Architecture Overview

The application follows a modern full-stack architecture optimized for real-time multimodal interaction.

```text
┌────────────────────────────────┐          ┌────────────────────────────────┐
│      USER ENVIRONMENT          │          │      CLOUD INFRASTRUCTURE      │
│         (Browser)              │          │         (GCP VM)               │
│                                │          │                                │
│  ┌──────────────────────────┐  │          │  ┌──────────────────────────┐  │
│  │    React Frontend        │◄─┼──HTTP───►│    Express Backend       │  │
│  │ (Vite, Tailwind, GenAI)  │  │  Config  │  │ (Node.js, PM2 Managed)   │  │
│  └─────────────┬────────────┘  │          │  └─────────────┬────────────┘  │
│                │               │          │                │               │
│                │ WebSocket     │          │                │ Serves        │
│                ▼               │          │                ▼               │
│  ┌──────────────────────────┐  │          │  ┌──────────────────────────┐  │
│  │    Gemini Live API       │  │          │  │    Static Assets         │  │
│  │ (Voice / Vision / Tools) │  │          │  │      (/dist)             │  │
│  └─────────────┬────────────┘  │          │  └──────────────────────────┘  │
│                │               │          └────────────────────────────────┘
│                │ Tool Calls    │
│                ▼               │          ┌────────────────────────────────┐
│  ┌──────────────────────────┐  │          │      GOOGLE AI SERVICES        │
│  │  Imagen 3 / Veo 3.1      │◄─┼──────────┤                                │
│  │ (Image & Video Gen)      │  │          │  (High-Fidelity Generation)    │
│  └──────────────────────────┘  │          └────────────────────────────────┘
└────────────────────────────────┘
```

### System Data Flow
1. **Initialization**: The **React Frontend** fetches the Gemini API key from the **Express Backend** via `/api/config`.
2. **Uplink**: A secure **WebSocket** is established directly between the browser and **Gemini 2.5 Flash Live**.
3. **Interaction**: User voice/video is streamed to Gemini; Gemini streams back real-time audio and tool instructions.
4. **Asset Generation**: When Gemini triggers a tool, the Frontend calls **Imagen** (for images) or **Veo** (for videos) to generate cinematic assets.
5. **Persistence**: **PM2** monitors the backend process on the VM, ensuring 24/7 availability.

### 1. Frontend (React & Vite)
- **Real-time Voice/Video**: Utilizes the `@google/genai` SDK to establish a low-latency WebSocket connection with the Gemini 2.5 Flash Live model.
- **Multimodal Feedback**: Features a dynamic 3D-effect avatar that reacts to agent sentiment, audio levels, and system states.
- **Asset Vault**: A dedicated space for viewing AI-generated static images (Imagen) and cinematic videos (Veo).
- **Styling**: Built with **Tailwind CSS** using a "Technical Dashboard" aesthetic (Recipe 1) with glassmorphism and high-density data grids.

### 2. Backend (Express.js)
- **Static Hosting**: Serves the compiled React frontend in production.
- **Configuration API**: Provides a secure `/api/config` endpoint to deliver the Gemini API key to the frontend, ensuring keys are managed via server-side environment variables.
- **SPA Routing**: Implements Express 5 compatible catch-all middleware to support client-side routing.

### 3. AI Integration
- **Gemini Live API**: Powers the core voice-to-voice and vision-to-voice experience.
- **Function Calling**: The agent can autonomously trigger tools to:
  - Generate visual summary cards (Imagen).
  - Create cinematic financial journey videos (Veo).
  - Initiate secure fund transfers between accounts.
- **Grounding**: Capable of using Google Search for real-time financial news and market data.

### 4. Infrastructure
- **Compute**: Deployed on **Google Compute Engine (GCE)** using an `e2-medium` instance.
- **Process Management**: Uses **PM2** to ensure the Node.js server is highly available and restarts automatically on crashes or VM reboots.
- **Security**: Configured with Google Cloud VPC firewalls and local UFW rules.

---

## 🚀 VM Deployment Guide

This project includes a fully automated deployment script that provisions infrastructure and deploys the code in one step.

### Prerequisites
- **Google Cloud SDK**: Installed and authenticated on your local machine (`gcloud auth login`).
- **Gemini API Key**: Obtained from [Google AI Studio](https://aistudio.google.com/).

### Deployment Steps

1. **Configure the Script**
   Open `create-and-deploy-gcp-vm.sh` and update the following variables:
   ```bash
   PROJECT_ID="your-gcp-project-id"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

2. **Make the Script Executable**
   ```bash
   chmod +x create-and-deploy-gcp-vm.sh
   ```

3. **Run the Deployment**
   ```bash
   ./create-and-deploy-gcp-vm.sh
   ```

### Post-Deployment: Browser Security

Because the VM uses an IP address over HTTP, modern browsers will block Microphone and Camera access by default. To test the multimodal features, you must enable a developer flag in Chrome:

1. Open Chrome and navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. **Enable** the flag.
3. In the text box, enter your VM URL (e.g., `http://34.170.200.71:3000`).
4. Click **Relaunch** at the bottom of the page.
5. Access the app and click **"Connect Private Uplink"**.

---

## 🛠 Local Development

To run the application locally:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
