FROM node:20-alpine as build

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine as production

# skipping set env, as it's sensitive??

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /usr/src/app/build ./build

COPY ./data .

CMD ["node", "build/index.js"]



# Too simple?
# FROM node:20-alpine

# WORKDIR /usr/src/app

# COPY package*.json .

# RUN npm install

# COPY . .

# RUN tsc

# CMD ["node", "./build/index.js"]



