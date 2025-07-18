# 🐳 Docker Setup for Python Face Recognition Microservice

This guide explains how to build, run, and use the Dockerized Python microservice for face recognition in the Home Service Platform.

## 🚀 Quick Start

### 1. Build the Docker Image
```bash
cd python_environment
docker build -t your-dockerhub-username/home-service-face:latest .
```

### 2. Run the Docker Container
```bash
docker run -d -p 10000:10000 your-dockerhub-username/home-service-face:latest
```
- The service will be available at `http://localhost:10000`.

### 3. (Optional) Push to DockerHub
```bash
docker login
docker push your-dockerhub-username/home-service-face:latest
```

### 4. Connect Backend to Microservice
- Set `PYTHON_SERVICE_URL=http://localhost:10000` (or your deployed URL) in your backend `.env` file.

## 📝 TODOs for Contributors
- [ ] Ensure Docker is installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- [ ] Build the Docker image as shown above
- [ ] Run the container and verify FastAPI is running on port 10000
- [ ] Update backend `.env` with the correct `PYTHON_SERVICE_URL`
- [ ] (If publishing) Push the image to DockerHub and update documentation with the image name
- [ ] Test the endpoints:
  - [ ] `POST /register-face`
  - [ ] `POST /start-verify-session`
  - [ ] `POST /verify-frame`
  - [ ] `POST /end-verify-session`
- [ ] Document any changes or issues in this file

## ℹ️ Notes
- The microservice is used for face login/registration features in the platform.
- You can run the service locally or deploy it to any cloud provider that supports Docker.
- For multi-container setups, consider using Docker Compose (not included by default).
- If you improve or extend the microservice, update this file and the main README accordingly. 