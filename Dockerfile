FROM node:10.16.0-alpine

RUN apk add python alpine-sdk

RUN mkdir -p /tt-vc
WORKDIR /tt-vc

COPY package.json .
COPY package-lock.json .
RUN npm i

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
