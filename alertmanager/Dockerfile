FROM prom/alertmanager:v0.26.0

ADD alertmanager.yml /etc/alertmanager/conf/
ADD message.template /etc/alertmanager/templates/

CMD ["--config.file=/etc/alertmanager/conf/alertmanager.yml"]
