# SMU Buddy
https://smu-buddy.site

## Project Overview
SMU Buddy is an all-in-one school assistant which offers a comprehensive solution to improve group project task tracking, class participation tracking, scheduling, communication and information dissemination.

## Problem Statement
SMU Buddy addresses key pain points students face in managing academic tasks:
-   Inefficient Tracking of Group Tasks: Difficulty in monitoring contributions and task progress within group projects.
-   Inefficient Tracking of Class Participation: Students struggle to record and recall their participation without interrupting class focus.
-   Decentralized Communication: Information is dispersed across multiple platforms (e.g., Slack, Teams, Telegram), increasing the risk of missing important updates.
-   Scheduling Challenges: Difficulty in scheduling meetings and remembering invites.

## Solutions
-  Project Group Task Tracking:
    -    Create your tasks for individual groups
    -    Track progress throughout the semester
-  Class Participation Tracking:
    -  Record class participation with speech-to-text in real time
    -  Students do not have to try very hard to recall what happened in class
    -  Students will not risk losing track in class
-  Centralized Communication Chat Rooms:
    -  A unified chat room for each module consolidates all information and updates within one application
    -  Students will not risk missing out important information
-  Easy Scheduling
    -  Send email invites to group members to ensure meeting attendance

## Demo
Will Update Link

## Tech Stack
-  Frontend:
    -  Vue.js
    -  PrimeVue
    -  BootStrap
-  Backend:
    -  Node.js
    -  Express.js
    -  mongoDB
    -  socket.io
-  Beyond The Lab:
    -  Vue Router
    -  Git
    -  GitHub
    -  Google Cloud Platform
-  APIs
    - Google Text-to-Speech API: For recording class participation.
    - Google Calendar API: To facilitate scheduling and reminders.
    - Mailgun API: To send email invitations to group members.
 

## Getting Started
### Prerequisites
-  Node.js
-  Vue CLI
  
## Installation
Clone the repository:
```
git clone https://github.com/your-username/SMU-Buddy.git
```
Navigate into the project directory:
```
cd SMU-Buddy
```

Configure API keys in the .env file:
-  Google Text-to-Speech API
-  Google Calendar API
-  Mailgun API

# Environment variables
```
MONGODB_URI= <mongodb atlas url>
JWT_SECRET= <generated jsonwebtoken secret>
SESSION_SECRET= <generated jsonwebtoken session secret>
NODE_ENV=development // npm run start uses production by default

MAILGUN_API_KEY=
MAILGUN_DOMAIN=
PORT=3000
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100

GOOGLE_CALENDAR_PRIVATE_KEY_FILE=./key.json

```
## Recommended deployment
```
Debian 12 with Node, NPM, Mongodb (for local db)
Cloudflare Always HTTPS
```
## Running the Application to start the application locally:
Please run ```npm i```, ```npm run build```, ```npm run start``` on the command lind to deploy