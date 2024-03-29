FROM node:20-slim

# Set the working directory.
WORKDIR /usr/src/app

# Copy the file from your host to your current location.
COPY package.json .

# Run the command inside your image filesystem.


RUN npm install --force

# Add metadata to the image to describe which port the container is listening on at runtime.
EXPOSE 80

# Run the specified command within the container.
CMD [ "npm", "start" ]

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

RUN cd client && npm install --force --network=host && npm run build
