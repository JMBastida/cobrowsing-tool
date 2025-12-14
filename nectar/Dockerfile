# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Build the cobrowsing library
RUN node scripts/libraries/cobrowsing/build-cobrowsing-lib.js

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
RUN npm install --only=production

COPY --from=build /usr/src/app .

EXPOSE 3001

CMD [ "node", "app.js" ]
