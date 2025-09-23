# backend/Dockerfile
FROM node:18-alpine

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
