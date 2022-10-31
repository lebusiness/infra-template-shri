FROM node:16.16.0
WORKDIR /shri-dz

COPY package*.json ./
RUN npm ci

COPY build ./
CMD npm start