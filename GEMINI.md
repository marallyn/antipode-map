# Project Context: Antipode Map

## Overview
This project is a web application that displays two side-by-side Google Maps.
- **Left Map:** Interactive, centered on user location (or default).
- **Right Map:** Displays the antipode (exact opposite side of the world) of the center of the left map.
- **Interaction:** Moving the left map updates the right map.
- **Visuals:** Full-screen, satellite view default.

## Architecture
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+).
- **External APIs:** Google Maps JavaScript API.
- **Deployment/Runtime:** Dockerized using Nginx (Alpine).

## Structure
- `index.html`: Main entry point, layout, and API script loader.
- `style.css`: Styling for full-screen layout and map containers.
- `script.js`: Map initialization, geolocation logic, and antipode calculation/synchronization.
- `Dockerfile`: Nginx configuration to serve static files.
- `docker-compose.yml`: Orchestration for local development (mapped port 8888).

## Setup & Run
1. **API Key:** Configured in `index.html`.
2. **Docker:**
   ```bash
   docker-compose up --build
   ```
3. **Access:** `http://localhost:8888`

## Conventions
- **Code Style:** Standard JS/CSS.
- **Git:** Commit messages should be descriptive.
- **Environment:** Secrets (API keys) are currently hardcoded in HTML for this prototype but should be moved to environment variables or restricted via Google Cloud Console HTTP referrers for production.
