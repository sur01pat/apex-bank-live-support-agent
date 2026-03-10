# Cognivox: The Multimodal Banking Concierge

*A #GeminiLiveAgentChallenge Submission*

## Inspiration

Modern banking has become a series of cold, transactional clicks. While digital banking is efficient, it has lost the "concierge" feel of traditional high-end finance. We were inspired by the idea of a "Living Interface"—a system that doesn't just wait for inputs but actively perceives the user's world. We wanted to bridge the gap between abstract financial data and human intuition by creating an agent that can see your documents, hear your concerns, and visualize your future.

## What it does

Cognivox is an AI-powered multimodal concierge integrated into the Apex Global Bank ecosystem. It provides:
- **Real-time Voice Interaction**: A low-latency, full-duplex voice interface that feels like talking to a human advisor.
- **Computer Vision**: The ability to "see" via the user's camera, identifying credit cards, bank statements, or even the user's emotional state.
- **Cinematic Asset Generation**: On-demand creation of high-fidelity infographics (via Imagen 3) and immersive video journeys (via Veo 3.1) to explain complex financial trends.
- **Autonomous Banking**: The agent can autonomously initiate transfers and manage accounts using secure function calling.

## How we built it

The project is built on a robust full-stack foundation:
- **Frontend**: React 18 with Vite, using the `@google/genai` SDK for real-time WebSocket communication. We implemented a custom Web Audio pipeline to handle PCM audio streaming at 16kHz (input) and 24kHz (output).
- **Backend**: An Express.js server (v5.0) that handles static asset serving and provides a secure API for configuration and key management.
- **Infrastructure**: Deployed on **Google Compute Engine** using automated shell scripts. We used **PM2** for process management to ensure 99.9% uptime.
- **AI Core**: 
    - **Gemini 2.5 Flash Live** for the primary multimodal reasoning loop.
    - **Imagen 3** for generating "Summary Cards" and "Receipts".
    - **Veo 3.1** for generating cinematic "Financial Future" videos.

### Technical Detail: Voice Activity Detection (VAD)
To ensure the agent doesn't talk over the user, we implemented a local VAD using the Root Mean Square (RMS) of the audio buffer:
$$RMS = \sqrt{\frac{1}{n} \sum_{i=1}^{n} x_i^2}$$
Where $x_i$ represents the individual PCM samples. If $RMS > \text{threshold}$, the agent's current audio playback is immediately truncated to allow the user to speak.

## Challenges we ran into

1. **Express 5 Migration**: During deployment, we encountered a `PathError` due to Express 5's new, stricter handling of wildcard routes. We had to pivot from regex-based routing to a catch-all middleware pattern: `app.use((req, res) => ... )`.
2. **The "Secure Context" Paradox**: Modern browsers block `getUserMedia` (Camera/Mic) on non-HTTPS origins. Since our VM was accessed via a public IP, we had to implement a diagnostic layer to help users configure Chrome's `unsafely-treat-insecure-origin-as-secure` flag for testing.
3. **Audio Synchronization**: Managing the `nextStartTime` for scheduled audio chunks in the Web Audio API was critical to prevent "clicking" or gaps between the 24kHz audio buffers streamed from Gemini.

## Accomplishments that we're proud of

- **Latency**: We achieved sub-500ms response times for voice-to-voice interaction, making the conversation feel truly natural.
- **Visual Fidelity**: Integrating **Veo 3.1** to turn a boring balance check into a 720p cinematic experience is something we haven't seen in any other banking app.
- **Infrastructure Automation**: Our `create-and-deploy-gcp-vm.sh` script can take a developer from "zero" to a "running cloud VM" in under 3 minutes.

## What we learned

- **Multimodal Prompting**: We learned that Gemini 2.5 Flash is incredibly sensitive to system instructions regarding "Scope". We had to refine the prompt to ensure the agent stayed within banking boundaries while remaining helpful.
- **Cloud Hardening**: Setting up UFW firewalls and PM2 persistence taught us the importance of "Reboot Resilience" in production AI applications.
- **Audio Engineering**: Working with raw PCM buffers and Sample Rates ($f_s$) gave us a deep appreciation for the complexity of real-time digital signal processing.

## What's next for Cognivox

1. **Biometric Voice Auth**: Integrating voiceprint analysis to authorize high-value transfers without needing a password.
2. **Multi-Agent Collaboration**: Allowing the Concierge to "call in" a specialized Investment Agent or Mortgage Agent for deeper queries.
3. **AR Integration**: Bringing the Cognivox avatar into Augmented Reality so your banking advisor can sit at your desk with you.

---
*Built with ❤️ for the #GeminiLiveAgentChallenge*
