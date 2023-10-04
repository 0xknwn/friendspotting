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

The we would need to instantiate the database, to proceed, run:

```shell
docker compose -p friendspotting -f docker-compose.yaml \
  run idxr sh -c "npx prisma migrate dev --name init"
```

```shell
docker compose -p friendspotting -f docker-compose.yaml \
  build api
docker compose -p friendspotting -f docker-compose.yaml \
  up idxr api -d
docker compose -p friendspotting logs idxr api -f
```

## Delete the indexer

```shell
docker compose -p friendspotting down idxr --rmi all -v
```
