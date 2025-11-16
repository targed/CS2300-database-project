# Use an official Python image as a parent image. Change this for your language of choice.
# e.g., for Node.js use: FROM node:18
FROM python:3.10-slim

# Set the working directory in the container to /workspace
WORKDIR /workspace

# Keeps the container running
CMD ["sleep", "infinity"]