FROM prom/prometheus:v2.47.2

ADD prometheus.yml prometheus.rules.yml /etc/prometheus/

CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/data/", "--storage.tsdb.retention=10d"]
