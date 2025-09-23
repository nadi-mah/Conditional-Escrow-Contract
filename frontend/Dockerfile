# frontend/Dockerfile
FROM node:18-bullseye

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
