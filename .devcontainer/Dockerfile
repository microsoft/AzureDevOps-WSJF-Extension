#-------------------------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See https://go.microsoft.com/fwlink/?linkid=2090316 for license information.
#-------------------------------------------------------------------------------------------------------------

# For information on the contents of the container image below, see following Dockerfile:
# https://github.com/microsoft/vscode-dev-containers/tree/v0.43.0/containers/javascript-node-12/.devcontainer/Dockerfile
# FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0.43-12
FROM ubuntu:16.04

# The image referenced above includes a non-root user with sudo access. Add 
# the "remoteUser" property to devcontainer.json to use it. On Linux, the container 
# user's GID/UIDs will be updated to match your local UID/GID when using the image
# or dockerFile property. Update USER_UID/USER_GID below if you are using the
# dockerComposeFile property or want the image itself to start with different ID
# values. See https://aka.ms/vscode-remote/containers/non-root-user for details.
# ARG USER_UID=1000
# ARG USER_GID=$USER_UID
# ARG USERNAME=node

# ENV PATH=${PATH}:/usr/local/share/npm-global/bin

# # [Optional] Update UID/GID if needed
# RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
#         groupmod --gid $USER_GID $USERNAME \
#         && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
#         && chown -R $USER_UID:$USER_GID /home/$USERNAME; \
#     fi \
#     #
#     # Set alternate global install location that both uses have rights to access
#     && mkdir -p /usr/local/share/npm-global \
#     && chown ${USERNAME}:root /usr/local/share/npm-global \
#     && npm config -g set prefix /usr/local/share/npm-global \
#     && sudo -u ${USERNAME} npm config -g set prefix /usr/local/share/npm-global \


# *************************************************************
# * Uncomment this section to use RUN instructions to install *
# * any needed dependencies after executing "apt-get update". *
# * See https://docs.docker.com/engine/reference/builder/#run *
# *************************************************************
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# update the repository sources list
# and install dependencies
RUN apt-get update \
    && apt-get install -y \
    git \
    curl \
    file \
    && apt-get -y autoclean

# nvm environment variables
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 13.7.0

# install nvm
# https://github.com/creationix/nvm#install-script
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash

# install node and npm
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# confirm installation
RUN node -v
RUN npm -v

# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update && apt-get -y install \
#    git \
#    nodejs \
#    npm \
#    build-essential
   
# RUN curl-o-https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
# RUN nvm --version
# RUN nvm install 6.17.1
   #
   # Clean up
# RUN apt-get autoremove -y
# RUN apt-get clean -y
# RUN rm -rf /var/lib/apt/lists/*
# ENV DEBIAN_FRONTEND=dialog

# Uncomment to default to non-root user
# USER $USER_UID
