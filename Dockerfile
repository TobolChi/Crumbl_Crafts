# Base Python image
FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libmysqlclient-dev default-libmysqlclient-dev ca-certificates curl tar sudo \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . /app

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Make run script executable
RUN chmod +x /app/run_metrics.sh

# --- GitHub Runner setup ---
RUN mkdir /actions-runner
WORKDIR /actions-runner
RUN curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz \
    && tar xzf ./actions-runner-linux-x64.tar.gz

# Copy entrypoint script
COPY entrypoint.sh .

# Ports for your API
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
