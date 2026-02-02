FROM python:3.11-slim

WORKDIR /app

RUN apt-get clean && apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends gcc libmariadb-dev ca-certificates curl tar sudo \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x /app/run_metrics.sh

ENV PORT=8080
EXPOSE 8080

CMD ["/app/run_metrics.sh"]
