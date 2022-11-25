FROM node:18-alpine as builder

# RUN apk add --no-cache libsecret-dev
WORKDIR /usr/src/app
COPY package.json .
COPY lerna.json .
COPY .yarn .yarn
COPY .yarnrc .
COPY yarn.lock .
COPY patches patches
RUN mkdir -p /usr/src/app/packages/contensis-cli
COPY packages/contensis-cli/esbuild.config.js packages/contensis-cli/.
COPY packages/contensis-cli/package.json packages/contensis-cli/.
COPY packages/contensis-cli/tsconfig.json packages/contensis-cli/.
COPY packages/contensis-cli/patches packages/contensis-cli/patches
# RUN ls -lah; cd packages; cd contensis-cli; ls -lah; exit 1
# RUN echo -e "`cat package.json`"; exit 1
RUN yarn run bootstrap
RUN yarn run postinstall
COPY packages/contensis-cli/src packages/contensis-cli/src
RUN yarn run build

FROM node:18-alpine
WORKDIR /usr/src/app
RUN apk add jq
# copy assets from source folder
COPY packages/contensis-cli/package.json .
COPY packages/contensis-cli/cli.js .
COPY packages/contensis-cli/patches patches
# adds almost 100MB to the container
RUN npm install --prefer-offline --no-audit --production --loglevel error
RUN npm run postinstall
# copy ./dist folder from builder container
COPY --from=builder /usr/src/app/packages/contensis-cli/dist dist
# npx link will create the npm binaries in /node_modules/.bin
# exit 0 allows the script to bypass errors with creating symlinks
RUN npx link .; exit 0
# add our ./node_modules/.bin folder to PATH
ENV PATH=/usr/src/app/node_modules/.bin:$PATH
# set an env var so we can alter app behaviour when running inside the container
ENV CONTAINER_CONTEXT=true
# call the executable
CMD [ "/usr/src/app/node_modules/.bin/contensis" ]
