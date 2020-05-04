# This file is a copy of the original found in mol-lib-config, please make modifications there instead
# ==============================================================================
# It has the following assumptions:
# 1. The current directory context is where the distribution is unpacked
# 2. The distribution should have everything that the image needs to run
# ==============================================================================

# ==============================================================================
# NPM install node_modules separately with the tools to build module binaries
# ==============================================================================

FROM node:12-slim as builder

# Install build tools
RUN apt-get update && apt-get upgrade -y && \
	apt-get install python3 -y && \
	apt-get install jq -y && \
	apt-get -y install python2.7 && \
	apt-get -y install git && \
	apt-get -y install build-essential

# Note that doing a straightforward upgrade `npm i -g npm@6.4.1` does not seem to work
# This is a known issue with npm 5, refer to this thread https://github.com/nodejs/docker-node/issues/449
# workaround using yarn is taken from that thread
RUN yarn global add npm@6.9.0 && npm --version

# Set python version
RUN cd /usr/bin && ln -s /usr/bin/python2.7 /usr/bin/python

# Copy files needed for the service to run
WORKDIR /service
COPY ./ .

# Install dependencies
RUN npm ci --production
RUN npm ci mol-lib-config

# ==============================================================================
# Run using the distribution and node_modules from builder
# ==============================================================================

FROM node:12-slim as app

EXPOSE 3000

# Install AWS CLI
RUN apt-get update && apt-get upgrade -y && \
	apt-get install python3 -y && \
	apt-get install python3-pip -y && \
	apt-get install jq -y && \
	apt-get install curl -y && \
	pip3 install awscli --upgrade

# Set container timezone
ENV TZ=Asia/Singapore
RUN	echo 'Asia/Singapore' > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata

# Copy files needed for the service to run
WORKDIR /service
COPY --from=builder /service .

# Run using the project's start up script
ENTRYPOINT [ "/service/scripts/entrypoint.sh" ]
