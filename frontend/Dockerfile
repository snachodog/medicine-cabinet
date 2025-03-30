# Use the official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your dev server runs on (usually 3000)
EXPOSE 3000

# Run the development server
CMD ["npm", "run", "dev"]
