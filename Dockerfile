FROM ubuntu:22.04
 
# System Base Settings 
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
 
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3-pip \
    python3.11-venv \
    libpq-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/*
 
RUN ln -sf /usr/bin/python3.11 /usr/bin/python3 \
    && ln -sf /usr/bin/python3.11 /usr/bin/python
 
# Working Directory
WORKDIR /aegis
 
# Python Virtual Environment
COPY .venv/ .venv/
RUN python3.11 -m venv .venv \
    && .venv/bin/pip install --upgrade pip

# Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
 
# Copy the source code
COPY app/ ./app/
COPY ml_models/ ./ml_models/
 

#  Healthcheck  
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1
 
EXPOSE 8000
 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
 
