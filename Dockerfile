FROM node:25

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the app
COPY . .

# Add args
ARG NEXT_PUBLIC_AASX_API_URL
ENV NEXT_PUBLIC_AASX_API_URL="http://192.168.2.32:1891"

# Step 7: Expose port and start
EXPOSE 3000
CMD ["npm", "run", "dev"]