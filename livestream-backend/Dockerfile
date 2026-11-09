FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

# Install FFmpeg and curl for video processing and health checks
RUN apk add --no-cache ffmpeg curl

WORKDIR /app

# Create directories for recordings and videos
RUN mkdir -p /recordings /videos/daily /videos/thumbnails

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
