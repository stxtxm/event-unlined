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

# Init git repo and set remote if GIT_REMOTE_URL is provided
RUN cd server && \
  git init && \
  git config user.name "Render Bot" && \
  git config user.email "bot@render.com" && \
  if [ -n "$GIT_REMOTE_URL" ]; then git remote add origin $GIT_REMOTE_URL; fi

RUN cd client && npm run build && npm prune --production

WORKDIR /app/server

EXPOSE $PORT

CMD ["npm", "start"]
