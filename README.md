# Streaming Platform

This is a full-stack streaming platform project that allows users to broadcast live video from their computer using software like OBS and allows others to watch the streams in real-time.

## Project Architecture

The platform is built with a microservices-oriented architecture, consisting of three main components:

1.  **`frontend`**: A [Next.js](https://nextjs.org/) application serving the user interface. It's built with React, TypeScript, and [shadcn/ui](https://ui.shadcn.com/) for the component library. Users can register, log in, view streams, and manage their own stream settings here.

2.  **`backend`**: A [Node.js](https://nodejs.org/) application using the [Express](https://expressjs.com/) framework. It acts as the central API for managing users, authentication (JWT), stream states, and validating stream keys. It uses MongoDB as its database.

3.  **`media-server`**: A lightweight Node.js server using [node-media-server](https://github.com/illuspas/Node-Media-Server) to handle the real-time video aspects. It ingests RTMP streams from OBS, transcodes them into HLS (HTTP Live Streaming) format, and serves the video segments to viewers.

### How It Works

1.  A user (streamer) registers on the platform via the `frontend`.
2.  The `backend` creates a new user in the database and generates a unique **Stream Key**.
3.  The streamer configures their broadcasting software (e.g., OBS) with the provided RTMP server URL (`rtmp://localhost:1935/live`) and their unique Stream Key.
4.  When the streamer starts broadcasting, OBS sends the RTMP stream to the `media-server`.
5.  The `media-server` receives the stream and makes an API call to the `backend` to validate the Stream Key.
6.  If the key is valid, the `media-server` starts transcoding the video to HLS and notifies the `backend` that the stream is live.
7.  The `backend` updates the user's status to "Live".
8.  Viewers can now see the live stream on the `frontend`. The `frontend` player fetches the HLS playlist (`.m3u8` file) from the `media-server` and plays the stream.
9.  When the streamer stops broadcasting, the `media-server` notifies the `backend`, which updates the user's status accordingly.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v18.x or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running.
- [OBS Studio](https://obsproject.com/) or other RTMP-capable broadcasting software.
- A package manager like `npm` or `yarn`.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd streaming-platform
    ```

2.  **Set up Environment Variables:**

    - Navigate to the `backend` directory: `cd backend`
    - Create a `.env` file by copying the example: `cp .env.example .env`
    - Edit the `.env` file and configure your `MONGO_URI` and `JWT_SECRET`.

3.  **Install Dependencies for all services:**
    ```bash
    # In the root directory
    cd backend && npm install
    cd ../frontend && npm install
    cd ../media-server && npm install
    ```

### Running the Platform

You need to run all three services simultaneously in separate terminal windows.

1.  **Start the Backend API:**

    ```bash
    cd backend
    npm start
    ```

    The API will be running on `http://localhost:3001`.

2.  **Start the Frontend Application:**

    ```bash
    cd frontend
    npm run dev
    ```

    The web app will be available at `http://localhost:3000`.

3.  **Start the Media Server:**
    ```bash
    cd media-server
    node server.js
    ```
    The RTMP server will be listening on `rtmp://localhost:1935` and the HLS streams will be served from `http://localhost:8000`.

## Future Ideas & Improvements

This project has a solid foundation but can be extended with many exciting features:

- **Real-time Chat:** Implement WebSocket-based chat for each stream to allow viewers to interact with the streamer and each other.
- **VODs (Video on Demand):** Configure the media server to save recordings of live streams (e.g., to a local folder or a cloud storage service like AWS S3), allowing users to watch them later.
- **User Profiles:** Create public profile pages for streamers where they can add a description, profile picture, and see a gallery of their past streams (VODs).
- **Stream Categories & Tags:** Allow streamers to categorize their streams (e.g., "Gaming", "Music", "Education") to improve discoverability.
- **Follow System:** Let users follow their favorite streamers and get notifications when they go live.
- **Streamer Dashboard Analytics:** Provide streamers with analytics, such as concurrent viewers over time, total views, and chat activity.
- **Monetization:**
  - **Donations:** Integrate with services like Stripe or PayPal for one-time donations.
  - **Subscriptions:** Implement a tiered subscription system for exclusive perks.
- **Enhanced Security:** Add rate limiting to the API, more robust validation, and secure HLS streams.
- **Deployment & Scalability:**
  - **Dockerize the application:** Create `Dockerfile`s for each service and a `docker-compose.yml` file for easy setup and deployment.
  - **Cloud Deployment:** Write guides for deploying to cloud providers like AWS, Google Cloud, or DigitalOcean.
  - **Scalable Media Server:** Explore using a more robust media server solution or a cloud-based media service for handling a larger number of concurrent streams and viewers.
- **Improved UI/UX:**
  - Add a "recommended streams" section on the homepage.
  - Implement a more sophisticated video player with quality settings and volume controls.
  - Refine the overall design and user experience.
