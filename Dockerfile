FROM node:10.13-alpine

RUN apk add python alpine-sdk ffmpeg

RUN mkdir -p /tt-vc
WORKDIR /tt-vc

COPY package.json .
COPY package-lock.json .
RUN npm i -d

COPY . .

RUN npm build

CMD ["npm", "run start"]
