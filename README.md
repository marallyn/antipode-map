# Antipode Map

A simple web application that displays two Google Maps side-by-side. 
- **Left Map:** Interactive map centered on your current location.
- **Right Map:** Automatically tracks the exact opposite side of the world (antipode) as you move the left map.

## Setup

### 1. Google Maps API Key
To use this application, you must have a valid Google Maps API Key with the **Maps JavaScript API** enabled.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project or select an existing one.
3. Enable the **Maps JavaScript API**.
4. Create an API Key (Credentials).
5. Open `index.html` in this directory.
6. Find the line:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
   ```
7. Replace `YOUR_API_KEY` with your actual key.

### 2. Running with Docker

This project is set up to run easily with Docker.

1. Ensure Docker Desktop is running.
2. Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to:
   [http://localhost:8888](http://localhost:8888)

## Development
The `docker-compose.yml` mounts the current directory to the container, so any changes you make to `index.html`, `style.css`, or `script.js` will be reflected immediately upon refreshing the page.
