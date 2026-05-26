# About the project

Our app is called Livin.

It is an app for posting and searching jobs of pet and plant sitters, and it will have a case for taking care of stray animals temporally. Our app will also have a smart match algorithm between jobs seekers and job offers.

# Setup

## Prerequisites

- [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) (Mac\Linux) or [NVM For Windows](https://github.com/coreybutler/nvm-windows/releases)

- Google Maps API Key from [Google Cloud Console](https://console.cloud.google.com/) with the following APIs enabled:
  - **Maps JavaScript API** — renders the map
  - **Places API** (the classic version, *not* "Places API (New)") — powers the location search autocomplete on the jobs screen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Set NodeJS Environment

Run the setup commands

```(bash)
nvm install && npm i -g @angular/cli && npm i
```

Generate a local environment file for the frontend:

```(bash)
cp frontend/src/environments/environment.template.ts frontend/src/environments/environment.local.ts
```

Replace the google api key place holder with your key

## Database (Prisma)

After installing dependencies, generate the Prisma client:

```(bash)
cd backend && npx prisma generate
```

When the schema changes, apply migrations to the database:

```(bash)
cd backend && npx prisma migrate dev
```

To inspect the database visually:

```(bash)
cd backend && npx prisma studio
```

## Run the app from terminal
Open a second terminal. Run in one terminal the backend and in the second the frontend:
```(bash)
npm run dev:backend
```
```(bash)
npm run dev:frontend
```

## Run the app with docker
Copy .env.example in the root folder into a new .env file and run the app:
```(bash)
docker compose up -d
```