import { createServer } from "http";
import { adminServer } from "./admin";

import { app } from "./express";

const port = process.env.PORT || "8080";
const admin_port = process.env.ADMIN_PORT || "8081";

const server = createServer(app);

server.listen(port, () => {
  console.log(`server started on port ${port}`);
});

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});
