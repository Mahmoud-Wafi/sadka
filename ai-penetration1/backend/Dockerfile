# Use a slim Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies (Scanners)
RUN apt-get update && apt-get install -y \
    nmap \
    sqlmap \
    whatweb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 5000

# Start Django with Gunicorn (or management server for now)
CMD ["python", "manage.py", "runserver", "0.0.0.0:5000"]
