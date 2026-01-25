FROM node:20-alpine

WORKDIR /app

COPY client/package*.json ./client/
RUN cd client && npm ci --omit=dev

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY client/ ./client/
COPY server/ ./server/

RUN cd client && npm run build

WORKDIR /app/server

EXPOSE $PORT

CMD ["npm", "start"]
