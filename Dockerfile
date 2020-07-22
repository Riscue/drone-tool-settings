ARG NODE_VERSION=12-alpine

FROM node:${NODE_VERSION} AS build

WORKDIR /plugin

COPY package.json .
COPY package-lock.json .

ENV NODE_ENV production
RUN npm ci

FROM node:${NODE_VERSION}

WORKDIR /plugin

COPY --from=build /plugin/node_modules /plugin/node_modules

COPY . /plugin

ENV NODE_ENV production

ENTRYPOINT [ "node", "/plugin/index.js" ]