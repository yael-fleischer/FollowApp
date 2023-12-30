# FollowApp - Smart Video Conference Summarizer
FollowApp is an innovative Chrome Extension designed to streamline the workflow in team-based environments. It automatically transcribes video call recordings and generates detailed summaries, including key points and assigned tasks with deadlines. The app addresses the common challenge of summarizing meetings and tracking action items, especially in multilingual settings.

<h3>Motivation:</h3>
The idea emerged from our daily challenges in managing team communication and tasks in a global work environment. The application saves significant time in summarizing meetings and understanding follow-up tasks, particularly when conversations occur in foreign languages.

<h3>Core Files:</h3>
<u>Manifest.json:</u> Metadata and basic settings of the extension.
<u>popup.js:</u> Manages user interactions and file uploads to the local server for processing.
<u>popup.html:</u> Provides the visual interface for file upload and feedback.
<u>server.js:</u> Backend script managing file uploads, audio extraction using FFmpeg, transcription with Google Speech to Text, and summary creation via OpenAI's ChatGPT.

<h3>Integrations:</h3>
Google Cloud Storage API: Used for uploading audio files and storing transcripts and summaries.
Google Cloud Speech to Text API: Transcribes audio files.
OpenAI API: Summarizes transcripts using the gpt-3.5-turbo model for optimal results.
Security and Server Setup: Adapted to Chrome Extension V3 standards for enhanced security and use of Server Workers. Separate keys for Google and OpenAI integrations ensure user-side protection.

<h3>Key Features:</h3>
Automated video call transcription and summarization.
Integration with Google Cloud and OpenAI for reliable and efficient processing.
User-friendly Chrome Extension interface for easy operation.

<h3>Future Developments:</h3>
Enhancing the user interface for a more interactive experience.
Implementing additional security measures for data protection.
