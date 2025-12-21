# Build Stage
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Run Stage
# Using a more standard/stable Eclipse Temurin image instead of slim to avoid resolver errors
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/dashboard-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
