FROM node:20

WORKDIR /app
ADD package.json package-lock.json .
RUN npm ci

ADD . .
RUN npm run build

CMD ["npm", "run", "start"]

