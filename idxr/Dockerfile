FROM node:20
RUN npm install -g pnpm

WORKDIR /app
ADD package.json pnpm-lock.yaml .
RUN pnpm install

ADD . .
RUN npm run build

CMD ["npm", "run", "start"]
