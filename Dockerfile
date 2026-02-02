FROM python:3.11-slim

WORKDIR /app

# Install system deps for MySQL/MariaDB client, build tools, and runner deps
RUN apt-get clean && apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends gcc libmariadb-dev ca-certificates curl tar sudo \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (so Docker can cache pip install)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy rest of project files
COPY . /app
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
