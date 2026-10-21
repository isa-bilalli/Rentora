# syntax=docker/dockerfile:1

# Build: the Maven wrapper packages the jar. Tests run in CI, not in the image build.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
# The cache mount keeps Maven and the downloaded dependencies between builds.
RUN --mount=type=cache,target=/root/.m2 \
    sh mvnw --batch-mode --no-transfer-progress -DskipTests package

# Run: only a JRE and the jar, as a user without root rights.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S rentora && adduser -S rentora -G rentora
COPY --from=build /workspace/target/*.jar app.jar
USER rentora
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
