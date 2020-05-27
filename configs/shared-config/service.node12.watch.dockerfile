# This file is a copy of the original found in mol-lib-config, please make modifications there instead
# ==============================================================================
# These are the differences from the service Dockerfile
# - Exposes 6000 as the debug port
# - Includes build tools to re-compile binaray modules
# - Copies the entire project directory rather than dist/ alone
# - Runs watcher and assumes watcher-install and watcher-build npm scripts are available
# ==============================================================================

FROM node:12-slim

EXPOSE 3000
EXPOSE 6000

# Set container timezone
ENV TZ=Asia/Singapore
RUN	echo 'Asia/Singapore' > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata

# Install build dependencies
RUN apt-get update && apt-get upgrade -y && \
	apt-get -y install python2.7 && \
	apt-get -y install git && \
	apt-get -y install build-essential

# Note that doing a straightforward upgrade `npm i -g npm@6.4.1` does not seem to work
# This is a known issue with npm 5, refer to this thread https://github.com/nodejs/docker-node/issues/449
# workaround using yarn is taken from that thread
RUN yarn global add npm@6.9.0 && npm --version

# Set python version
RUN cd /usr/bin && ln -s /usr/bin/python2.7 /usr/bin/python

RUN npm install -g forever npm-watch

# Copy files needed for the service to run
WORKDIR /service
COPY package*.json ./

# Install dependencies
RUN npm install

COPY ./ .
# Note: node_modules may get overriden if you mount a volume, so a reinstall might be required
CMD bash -c "npm-watch"
