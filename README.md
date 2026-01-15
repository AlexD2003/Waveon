# Waveon

A simple music platform prototype with a Spring Boot backend and a React + Vite frontend. Waveon exposes REST APIs for users, artists, songs and playlists, supports JWT authentication and streaming of audio resources. The repository includes Dockerfiles and a docker-compose stack for quick demo runs.

Highlights
- Backend: Spring Boot (Java/Gradle), JWT-based auth, Flyway migrations, PostgreSQL support.
- Frontend: React + TypeScript, Vite, PrimeReact + PrimeFlex UI.
- Media: sample audio files included in backend resources and endpoints to stream them.
- Docker: images for backend & frontend and a Postgres database orchestrated with docker-compose.

Table of contents
- Project structure
- Quick start — recommended (local)
- Quick start — Docker (one-command)
- Environment & configuration
- Backend: build, run, tests
- Frontend: build, run
- API reference (auth, songs, playlists, users)
- Media & file upload notes
- Troubleshooting & common gotchas
- Contributing
- License

Project structure (high level)
- backend/ — Spring Boot application
  - src/main/java/backend — controllers, services, models
  - src/main/resources/audio — included sample MP3 files
  - src/main/resources/db/migration — Flyway migrations
  - build.gradle / gradle wrapper
  - Dockerfile
- frontend/ — React + TypeScript + Vite app
  - src/ — components, pages
  - package.json
  - Dockerfile
- docker-compose.yaml — backend + frontend + postgres dev stack
- env.properties — example config file used by Spring Boot config import (optional)

Quick start — recommended (local development)
This path is best for development, debugging and faster iteration.

Prerequisites
- Java JDK 17+ (the Gradle build tool uses a Java toolchain; the project targets Java 24 in build.gradle — install a compatible JDK or let Gradle use toolchain if available)
- Node.js 18+ and npm
- PostgreSQL (optional if you want to use local DB instead of Docker) or Docker (for Postgres)
- git

1) Backend: run locally
- From repository root:
  cd backend
  # Option A: run with Gradle wrapper (recommended)
  ./gradlew bootRun
  # Option B: build then run jar
  ./gradlew build -x test
  java -jar build/libs/backend-0.0.1-SNAPSHOT.jar

- By default (as configured in backend/src/main/resources/application.yaml):
  - Server listens on port 8081
  - REST API context path: /api
  - Example base URL: http://localhost:8081/api

2) Frontend: run locally (development)
- From repository root:
  cd frontend
  npm install
  npm run dev
- Vite dev server will start (default port typically 5173). Open the address printed by Vite. The frontend in this repo expects the API running at http://localhost:8081/api (used by the login page).

Quick start — Docker (compose)
docker-compose is provided to run backend, frontend and Postgres together. There are a few important config caveats (see Troubleshooting section below). Here is a step-by-step:

1) Build and start:
docker-compose up --build

This will:
- Build backend and frontend container images using their Dockerfiles
- Start a PostgreSQL container with DB name `waveondb`, user `user` and password `password`

2) Visit:
- Backend: <http://localhost:8081/api> (note: see Troubleshooting below about port mapping)
- Frontend: <http://localhost:3000> (note: Dockerfile tries to run `npm start`, but package.json does not include "start" — see Troubleshooting)

Recommended Docker fixes (quick):
- Ensure backend container uses a port mapping that matches the Spring Boot port (8081) or override server port in the container:
  - either change docker-compose backend ports to "8081:8081"
  - or add env var in docker-compose for SERVER_PORT: 8080 (then map 8080:8080)
- Update frontend Dockerfile or package.json so the container runs correctly:
  - add a "start" script in frontend/package.json that runs vite preview or serve a build, or change Dockerfile to run npm run dev when in development.

Environment & configuration
Spring Boot config is in backend/src/main/resources/application.yaml and imports optional file env.properties:
- application.yaml reads DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD (from env.properties or environment)
- server.port is set to 8081 and context-path is /api by default.

Important env vars (used by the app):
- DATABASE_URL (e.g. jdbc:postgresql://db:5432/waveondb)
- DATABASE_USERNAME (e.g. user)
- DATABASE_PASSWORD (e.g. password)
- SERVER_PORT (optional override for server.port)

Note: docker-compose.yaml currently sets SPRING_DATASOURCE_URL / SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD which do NOT match the DATABASE_* keys used in application.yaml. Either:
- set DATABASE_URL / DATABASE_USERNAME / DATABASE_PASSWORD in docker-compose, or
- adjust application.yaml to use SPRING_DATASOURCE_* variables, or
- provide an env.properties file with the DATABASE_* entries inside the container.

Backend: build, run and tests
From /backend:

- Run with Gradle wrapper (development):
  ./gradlew bootRun

- Build (produces JAR):
  ./gradlew build

- Run tests:
  ./gradlew test

- Run the produced jar:
  java -jar build/libs/backend-0.0.1-SNAPSHOT.jar

- Docker image (as Dockerfile does):
  The Dockerfile builds the project with ./gradlew build --no-daemon -x test and runs the resulting JAR.

Database migrations
- Flyway migrations are stored in backend/src/main/resources/db/migration/*.sql
- Flyway is enabled in application.yaml (baseline-on-migrate: true)
- When the app starts, Flyway will run migrations against the configured DB.

Frontend: build & run
From /frontend:

- Install dependencies:
  npm install

- Start dev server:
  npm run dev

- Build production:
  npm run build
  # After build, you can serve the built files with a static server or use `vite preview`:
  npm run preview

Note: Dockerfile in frontend uses CMD ["npm", "start"] but package.json does not define a "start" script. Either:
- add a "start" script in package.json that serves production build, or
- change Dockerfile to run a specific script (for dev or preview).

API reference (concise)
Base URL (default): http://localhost:8081/api

Authentication
- POST /auth/login
  - Request (JSON):
    { "email": "<email>", "password": "<password>" }
  - Response (JSON):
    { "token": "<jwt>", "userId": <id> }
  - Example:
    curl -X POST "http://localhost:8081/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"user@example.com","password":"secret"}'

- POST /auth/register
  - Request (JSON):
    { "email":"<email>", "password":"<password>", "username":"<username>", "role":"USER" }
    - role must be "USER" or "ARTIST"
  - Example:
    curl -X POST "http://localhost:8081/api/auth/register" \
      -H "Content-Type: application/json" \
      -d '{"email":"artist@example.com","password":"aPwd","username":"Artist","role":"ARTIST"}'

JWT Authentication
- Many endpoints are secured. After login you will receive a JWT token. Include it as:
  Authorization: Bearer <token>

Songs
- GET /songs
  - Optional query: name (filter by name).
  - Example:
    curl "http://localhost:8081/api/songs"

- GET /songs/{id}
  - Get song metadata.
  - Example:
    curl "http://localhost:8081/api/songs/1"

- GET /songs/{id}/stream
  - Streams the audio file. The backend first tries the packaged resources (src/main/resources/audio/...), then looks in uploads/audio (external).
  - Example:
    curl -L "http://localhost:8081/api/songs/1/stream" --output song1.mp3

- POST /songs (create) — requires ARTIST role
  - Content-Type: multipart/form-data
  - Form data:
    name (string), artistName (string), genre (string), imageUrl (string), file (file)
  - Example (curl — replace <token> and files accordingly):
    curl -X POST "http://localhost:8081/api/songs" \
      -H "Authorization: Bearer <token>" \
      -F "name=My Song" \
      -F "artistName=My Artist" \
      -F "genre=POP" \
      -F "imageUrl=http://..." \
      -F "file=@/path/to/song.mp3"

- PUT /songs/{id} — requires ARTIST role
  - Update song metadata (JSON body matching SongDTO).

- DELETE /songs/{id} — requires ARTIST role

- POST /songs/{songId}/like?userId=<userId>
  - Toggle like for a user on a song (no auth param for userId though in production you'd derive userId from token)
  - Example:
    curl -X POST "http://localhost:8081/api/songs/5/like?userId=2"

- GET /songs/like?userId=<id>
  - Get liked songs for a user.

- GET /songs/genre/{genreName}
  - Get songs by genre.

Playlists
- POST /playlists
  - Create playlist (body: PlaylistDTO)
  - Example:
    curl -X POST "http://localhost:8081/api/playlists" \
      -H "Content-Type: application/json" \
      -d '{"name":"My Playlist","imageUrl":"http://...","privacy":"PUBLIC","userId":2}'

- POST /playlists/{playlistId}/songs/{songId}
  - Add song to playlist.

- GET /playlists
- GET /playlists/{id}
- PUT /playlists/{id}
- DELETE /playlists/{id}

Users
- POST /users
  - Create user (UserDTO). The backend also supports registration via /auth/register.

- GET /users
- GET /users/{id}
- GET /users/{id}/library
  - Returns a UserLibraryDTO (user playlists, followed artists, liked songs etc).

- PUT /users/{id}
- DELETE /users/{id}

Media & file upload notes
- Sample audio files are included under backend/src/main/resources/audio/. The SongController stream endpoint first attempts to serve these packaged audio files (ClassPathResource "audio/<filename>"). If an uploaded file isn't in classpath, the controller checks an external path uploads/audio/<filename> in the container/file system.
- The backend sets multipart limits in application.yaml (50MB). If you plan to upload audio files in Docker, ensure a writable uploads/audio path is mounted or configured.

Testing
- Backend unit/integration tests use JUnit (spring-boot-starter-test). Run:
  ./gradlew test

- Frontend currently has no automated tests in the repository.

Troubleshooting & common gotchas
1) Mismatched environment variable names
- application.yaml expects DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD (or env.properties with those names). docker-compose uses SPRING_DATASOURCE_* keys which will not populate those properties. To fix:
  - Option A: Change docker-compose.yaml to set DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD.
  - Option B: Provide an env.properties file in the backend container with the expected keys (the application file imports optional:file:env.properties).
  - Option C: Change application.yaml to reference SPRING_DATASOURCE_URL etc.

2) Port mapping mismatch (backend)
- application.yaml sets server.port: 8081 but docker-compose maps "8080:8080". Either:
  - Change docker-compose to "8081:8081", or
  - Add env var SERVER_PORT: 8080 to the backend service and keep the mapping. Spring Boot recognizes SERVER_PORT env var.

3) Frontend Dockerfile vs package.json
- Dockerfile runs `npm start` but there's no "start" script in package.json. To fix:
  - Add a `start` script in package.json (e.g. "start": "vite" or for production "start": "vite preview --port 3000"), or
  - Change Dockerfile CMD to use an existing script, e.g. `CMD ["npm", "run", "dev"]` (for development), or `CMD ["npm", "run", "preview"]` (after a build).

4) Postgres state between runs
- docker-compose mounts a named volume pgdata; to clear DB data:
  docker-compose down -v
  docker volume rm <repo>_pgdata

5) Permissions for uploads
- If you configure an external uploads directory, ensure the directory is writable by the container process.

6) Auth & roles
- Creating a user via /auth/register requires role either "USER" or "ARTIST". To use endpoints guarded with @PreAuthorize("hasRole('ARTIST')") you must register a user with role "ARTIST".

Development tips
- If you modify Flyway SQL files after the DB has been created, increment migration versions or clean DB (for development).
- Use Postman, Insomnia or curl for quick API verification. Remember to include Authorization header when calling protected endpoints.

Contribution
- Issues and PRs are welcome. Please:
  - Fork the repo
  - Create a branch named feature/<short-description> or fix/<short-desc>
  - Add tests for new behaviors where appropriate
  - Open PR with a clear description of changes and any migration steps

License
- Add a LICENSE file in the repo root. (No license is included in this repository by default; add one appropriate for your project.)

Acknowledgements
- This project uses Spring Boot, Flyway, PostgreSQL, React, Vite and PrimeReact.

FAQ (short)
- Q: Why is the frontend not starting in docker-compose?
  A: The Dockerfile tries to run `npm start` but package.json doesn't define it. See Troubleshooting above.

- Q: Why can't the backend connect to the DB when running with docker-compose?
  A: Likely env var mismatch (DATABASE_* vs SPRING_DATASOURCE_*). Ensure the correct variables are set for the app to read.

If you want, I can:
- Generate a suggested corrected docker-compose.yaml with matching env var names and port mappings.
- Provide an example .env (or env.properties) file ready to use for local and Docker runs.
- Add a sample Postman collection or a tiny CLI script with curl commands to exercise the API.