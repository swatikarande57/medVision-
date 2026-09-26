FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by OpenCV / Pillow / pydicom
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV SERVICE_NAME=medvision-ai
ENV VERSION=2.4.0
ENV AI_MODE=demo
ENV DEVICE=auto
ENV MAX_UPLOAD_SIZE_MB=20

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
