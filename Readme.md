# Anicards

# Pre-requisites

-   Install [Node.js](https://nodejs.org/en/) version 22.0.0 lts
-   If you want to be able to switch between different node versions, download [nvm](https://github.com/nvm-sh/nvm) instead

# Getting started

-   Clone the repository

```
git clone https://github.com/BrandonTheBusyBeaver117/discord-bot-game.git

```

-   Get the environment variables

1. Take the given .env file

2. `cd discord-bot-game`

3. Paste the env file into the root directory of the project

===========================  
If you want to also upload new images to the database, you should also follow these steps

4. Go to the google drive link

5. Download all images

6. `cd discord-botgame\data`

7. `mkdir images`

8. Place all downloaded images into data\images

# Installation

-   Install dependencies

```
cd discord-bot-game
npm install
```

-   Build and run the bot

```
npm run build
npm run start
```

-   To deploy new commands and start bot

```
npm run deploy-commands
```

# Prettier

There's a .prettierc file if you'd like to configure your own prettier formatter.
However, there's also the option of just running npm commands to format

To check format

```
npm run format:check
```

To prettier format all files

```
npm run pretty
```
