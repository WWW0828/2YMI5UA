# Architecture Overview

The application is a client-side, single-page web application built with React. It functions as an agent by combining user-driven intent with the powerful multimodal and function-calling capabilities of the Gemini API to provide interactive analysis of video content.

```ascii
+----------------------------------------------------------------------------------+
|                            Browser (Client-Side)                                 |
|                                                                                  |
| +-------------------------+      +---------------------------------------------+ |
| |      User Interface     |      |                 Agent Core                  | |
| |      (React App)        |----->|                                             | |
| |                         |      |  +-----------+     +----------------------+ | |
| | - Video Player          |      |  |  Planner  |---->|       Executor       | | |
| | - Mode Selector (Quiz,  |      |  | (User +   |     | (api.ts -> Gemini)   | | |
| |   Summary, etc.)        |      |  | App.tsx)  |     +----------------------+ | |
| | - Output Display        |      |  +-----------+               ^              | |
| |                         |      |       |                      |              | |
| +-------------------------+      |       v                      v              | |
|                                  |  +---------------------------------------+  | |
|                                  |  |            Memory (App.tsx)           |  | |
|                                  |  | - Short-Term: State (video URI)       |  | |
|                                  |  | - Long-Term: localStorage (History)   |  | |
|                                  |  +---------------------------------------+  | |
|                                  +---------------------------------------------+ |
|                                                                                  |
+----------------------------------------------------------------------------------+
              |                                        ^
              | (HTTPS API Calls)                      | (JSON Response / Function Call)
              v                                        |
+----------------------------------------------------------------------------------+
|                                  Google Cloud                                    |
|                                                                                  |
| +---------------------------+         +----------------------------------------+ |
| |     Gemini File API       | <-----> |           Gemini 2.5 Flash API           | |
| | (Uploads & hosts video)   |         | (Processes video + prompt, calls tools)| |
| +---------------------------+         +----------------------------------------+ |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

## Components

### 1. User Interface
- **Technology**: A dynamic web interface built with **React**.
- **Key Components**:
    - **`App.tsx`**: The main component that orchestrates the entire application state and logic.
    - **`VideoPlayer.tsx`**: Renders the video and provides playback controls.
    - **Mode Selector**: A UI panel where the user selects the analysis type (e.g., "Summary", "Quiz").
    - **Output Panels**: Components like `Quiz.tsx` and `Flashcards.tsx` that render the structured data returned by the agent.

### 2. Agent Core
The core logic runs entirely on the client-side within the browser.

- **Planner**: The planning is **user-directed**. The user selects a "mode" from the UI. This choice, handled in `App.tsx`, determines which prompt from `modes.ts` is sent to the executor. There is no autonomous LLM-based planner; the user is the planner.

- **Executor**: The `api.ts` file acts as the executor. Its `generateContent` function takes the user-selected prompt, a reference to the processed video file, and a list of tool declarations (`functions.ts`). It calls the Gemini API, which then performs the reasoning and intelligently executes the appropriate function (tool call).

- **Memory**:
    - **Short-Term/Contextual Memory**: Managed via React state in `App.tsx`. The URI of the uploaded video file is passed with every API call, giving the model context for the current task.
    - **Long-Term Memory**: Implemented using the browser's `localStorage`. The `learningHistory` state in `App.tsx` is automatically saved to `localStorage`, persisting user progress (watch time, quiz scores) across sessions.

### 3. Tools / APIs
- **`@google/genai` SDK**: The primary interface to the Google AI ecosystem.
- **Gemini 2.5 Flash API**: Used for all generative tasks. Its key capabilities utilized are:
    - **Multimodal Input**: Processing prompts that combine both text and a video file reference.
    - **Function Calling**: The model doesn't just return text; it intelligently calls functions defined in `functions.ts` (e.g., `set_quiz`, `set_flashcards`) with structured JSON data it extracts from the video.
- **Gemini File API**: Used via `ai.files.upload` to upload and prepare the user's video for analysis by the model.

### 4. Observability
- **Logging**: All logging is directed to the browser's **Developer Console**.
    - `console.log`: Tracks the status of video uploads and processing.
    - `console.error`: Captures API errors or issues with processing the model's response.
- **Tracing Decisions**: The agent's "decisions" can be traced in the **Network** tab of the browser's developer tools. By inspecting the `generateContent` requests, one can see the exact prompt and tool declarations sent to the model, and the resulting function call returned by the model.
- **Error Handling / Retries**:
    - `try...catch` blocks in `api.ts` and `App.tsx` handle API errors. User-facing errors are presented gracefully using a custom `Toast.tsx` component.
    - The video upload process in `api.ts` includes a polling loop with a 5-second delay to wait for the file to become `'ACTIVE'`, which serves as a simple retry mechanism for the processing step.
