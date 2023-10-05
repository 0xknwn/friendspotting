## Install the indexer

Using docker compose is a simple way to install the indexer. Assuming docker, 
git and make are installed, run the following command to start postgres and
redis:

```shell
git clone https://github.com/0xknwn/friendspotting && cd friendspotting
(cd idxr && make)
docker compose -p friendspotting -f docker-compose.yaml \
  up db redis -d
```

Then we would need to instantiate the database, to proceed, run:

```shell
docker compose -p friendspotting -f docker-compose.yaml \
  run idxr sh -c "npx prisma migrate dev --name init"
```

For each one of the existing service, i.e. `api`, `idxr` and `sync`,
we could build, start and log it:

```shell
export SERVICE="api"
docker compose -p friendspotting -f docker-compose.yaml \
  build ${SERVICE}
docker compose -p friendspotting -f docker-compose.yaml \
  up ${SERVICE} -d
docker compose -p friendspotting logs ${SERVICE} -f
```

## Delete a service

To stop and remove the image of a service, run:

```shell
export SERVICE="api"
docker compose -p friendspotting down ${SERVICE} --rmi all -v
```
