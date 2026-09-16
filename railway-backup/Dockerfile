FROM postgres:18-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    awscli \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backup.sh /app/backup.sh
COPY restore.sh /app/restore.sh

RUN chmod +x /app/backup.sh /app/restore.sh

CMD ["/app/backup.sh"]