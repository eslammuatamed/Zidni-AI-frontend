# syntax=docker/dockerfile:1

FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY app/pom.xml app/pom.xml
COPY app/src app/src
RUN mvn -pl app -am -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV JAVA_OPTS="-Xms512m -Xmx1024m"
COPY --from=build /workspace/app/target/edtech-app-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]