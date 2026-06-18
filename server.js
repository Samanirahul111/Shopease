// Custom Next.js server with Socket.io integration
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL
        ? [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:8080", "http://localhost:3000"]
        : ["http://localhost:8080", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Store io instance globally for use in API routes
  global.io = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      // Allow connection without token for admin
      return next();
    }
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.isAdmin = decoded.isAdmin || false;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join admin room if admin
    if (socket.isAdmin) {
      socket.join("admin-room");
      console.log(`[Socket.io] Admin joined admin-room: ${socket.id}`);
    }

    // Join user room
    if (socket.userId) {
      socket.join(`user-${socket.userId}`);
    }

    socket.on("admin:join", (data) => {
      if (data && data.isAdmin) {
        socket.join("admin-room");
        socket.emit("admin:joined", { success: true });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} - ${reason}`);
    });

    socket.on("ping", () => {
      socket.emit("pong", { time: Date.now() });
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(
        `> Ready on http://${hostname}:${port} [${dev ? "dev" : "production"}]`
      );
      console.log(`> Socket.io server running`);
    });
});
