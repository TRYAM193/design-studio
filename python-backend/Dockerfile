# Use python 3.10
FROM python:3.10

# Set working directory
WORKDIR /app

# FIX: Use 'libgl1' instead of the old 'libgl1-mesa-glx'
# Also added 'libglib2.0-0' which is often required for image processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY main.py .

# Environment variable for model path
ENV U2NET_HOME=/root/.u2net

# Start the app
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}