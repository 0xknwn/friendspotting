# Install indexer

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
  run indexer sh -c "npx prisma migrate dev --name init"
```

```shell
docker compose -p friendspotting -f docker-compose.yaml \
  up indexer -d
docker compose -p friendspotting logs indexer -f
```

# Delete the indexer

```shell
docker compose -p friendspotting down --rmi all -v
```

