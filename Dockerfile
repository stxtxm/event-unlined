FROM node:20-alpine

# Install git
RUN apk add --no-cache git

WORKDIR /app

COPY client/package*.json ./client/
RUN cd client && npm install

COPY server/package*.json ./
RUN npm install --omit=dev

COPY client/ ./client/
COPY server/ ./server/

RUN cd client && npm run build && npm prune --production

WORKDIR /app/server

EXPOSE $PORT

CMD ["npm", "start"]
