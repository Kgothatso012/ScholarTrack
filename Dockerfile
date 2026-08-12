FROM node:22-alpine

WORKDIR /app

# Install dependencies for Expo/EAS
RUN apk add --no-cache \
    android-sdk \
    openjdk17 \
    && rm -rf /var/cache/apk/*

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy source
COPY . .

# Generate native projects
RUN npx expo prebuild --platform android --clean

# Build APK
RUN cd android && ./gradlew assembleRelease

# Output APK
CMD ["cp", "android/app/build/outputs/apk/release/app-release.apk", "/app/malumescholartrack.apk"]
