# Using Prisma

Prisma is the ORM used by the idxr to store its data. In order to work, it
requires a Postgres development database to be up and running. To install,
run the following docker file:

```shell
docker compose -p postgres-prod -f docker-compose.prod.yaml up -d
docker compose -p postgres-dev -f docker-compose.dev.yaml up -d
```

To open an access to the postgres server, see

```shell
ssh -L 5432:localhost:5434 52.19.65.200
```

## Create the SQL migration file

```shell
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
npx prisma migrate dev --name init
```

```sql
postgres=# \d
                 List of relations
 Schema   |        Name        |   Type   |  Owner
----------+--------------------+----------+----------
 postgres | Log                | table    | postgres
 postgres | Log_id_seq         | sequence | postgres
 postgres | _prisma_migrations | table    | postgres
(3 rows)

postgres=# \d "Log"
postgres=# \q
```

## Apply the last migration file

```shell
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
npx prisma migrate deploy
```

## Deploy a new version

In the project, you should change the version in the `idxr/package.json` file and run
the following (change the version to fit your requirements):

```shell
npm run dist
ls -ltra dist
## check the last file of the list
scp dist/idxr-c0f13d1bd6.zip 52.19.65.200:/tmp/

ssh 52.19.65.200
sudo su -
cd scripts
rm -rf idxr
mkdir idxr
cd idxr
unzip /tmp/idxr-c0f13d1bd6.zip
```

The to rebuild and deploy the new version, run:

- for the `watcher`

```shell
docker compose -p postgres-dev down watcher
docker compose -p postgres-dev -f docker-compose.dev.yaml images
# change the image id ab1d3e4ca57b with the one from the watcher
docker rmi ab1d3e4ca57b
docker compose -p postgres-dev -f docker-compose.dev.yaml build watcher
docker compose -p postgres-dev images
docker compose -p postgres-dev -f docker-compose.dev.yaml up watcher -d
docker compose -p postgres-dev -f docker-compose.dev.yaml logs watcher -f
```

- for the `api`

```shell
docker compose -p postgres-dev down server
docker compose -p postgres-dev -f docker-compose.dev.yaml build server
docker compose -p postgres-dev -f docker-compose.dev.yaml up server -d
docker compose -p postgres-dev -f docker-compose.dev.yaml logs server -f
```
