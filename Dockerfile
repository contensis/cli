ARG app_base=node:20-alpine
ARG builder_base=node:20-alpine
# registry url supplied with `docker build --build-args builder_image=$BUILDER_IMAGE` 
ARG builder_image
FROM ${builder_base} AS prepare

# RUN apk add --no-cache libsecret-dev
WORKDIR /usr/src/app
# COPY .yarn .yarn
# COPY .yarnrc .
COPY packages/contensis-cli/package.json .
COPY packages/contensis-cli/patches patches
RUN yarn global add patch-package --silent
COPY .yarnrc.yml .
RUN yarn install --silent
# RUN yarn run postinstall

FROM ${builder_image} AS build
COPY packages/contensis-cli/esbuild.config.js .
COPY packages/contensis-cli/tsconfig.json .
COPY packages/contensis-cli/src src
RUN yarn run build

FROM ${app_base} AS final
WORKDIR /usr/src/app
RUN apk add jq -q
# copy assets from source folder
COPY packages/contensis-cli/package.json .
COPY packages/contensis-cli/cli.js .
COPY packages/contensis-cli/patches patches
# adds almost 100MB to the container
RUN npm install patch-package --global --prefer-offline --no-audit
RUN npm install --audit=false --production --loglevel error
# RUN npm run postinstall

FROM ${app_base} AS app
WORKDIR /usr/src/app
RUN apk add jq -q
# copy ./app folder from final layer
COPY --from=final /usr/src/app .
# copy ./dist folder from build layer
COPY --from=build /usr/src/app/dist dist
# npx link will create the npm binaries in /node_modules/.bin
# exit 0 allows the script to bypass errors with creating symlinks
RUN npx link .; exit 0
# add our ./node_modules/.bin folder to PATH
ENV PATH=/usr/src/app/node_modules/.bin:$PATH
# set an env var so we can alter app behaviour when running inside the container
ENV CONTAINER_CONTEXT=true
# call the executable
CMD [ "/usr/src/app/node_modules/.bin/contensis" ]
