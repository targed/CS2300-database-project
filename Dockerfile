# Use an official Python image as a parent image. Change this for your language of choice.
# e.g., for Node.js use: FROM node:18
FROM python:3.10-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Fish shell
RUN apt-get update && apt-get install -y fish && rm -rf /var/lib/apt/lists/*

# Set Fish as the default shell
ENV SHELL=/usr/bin/fish
SHELL ["/usr/bin/fish", "-c"]

# Set the working directory in the container to /workspace
WORKDIR /workspace

# Keeps the container running
CMD ["sleep", "infinity"]