# Use official Python 3.10 image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for dlib, face-recognition, opencv
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential cmake \
    libglib2.0-0 libsm6 libxrender1 libxext6 libgtk2.0-dev \
    libboost-all-dev libgl1 && \
    rm -rf /var/lib/apt/lists/*

# Copy only requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Now copy the rest of the code
COPY . .

# Expose the port (Render will set $PORT)
EXPOSE 10000

# Start the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]