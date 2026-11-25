FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY backend ./backend

EXPOSE 5000

CMD ["npm", "run", "dev"]
