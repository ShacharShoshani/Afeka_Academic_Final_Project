# About the project

Our app is called Livin.

It is an app for posting and searching jobs of pet and plant sitters, and it will have a case for taking care of stray animals temporally.

# Frontend Setup

## Prerequisites

- [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) (Mac\Linux) or [NVM For Windows](https://github.com/coreybutler/nvm-windows/releases)

- Google Maps API Key from [Google Cloud Console](https://console.cloud.google.com/) enabled for Maps JavaScript API

## Set NodeJS Environment

Run the setup commands

```(bash)
nvm install && npm i -g @angular/cli && cd livin_frontend && npm i
```

Generate a local environment file for the frontend (Run this from the livin_frontend directory, which you're now in):

```(bash)
cp src/environments/environment.template.ts src/environments/environment.local.ts
```

Replace the google api key place holder with your key

## Run the app

```(bash)
npm start
```

Visit http://localhost:4200 to see your app
