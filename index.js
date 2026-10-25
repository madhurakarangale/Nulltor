require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { Pool } = require("pg");

const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const dbPath = path.join(__dirname, "backend", "nulltor.db");
const sqliteDb = new sqlite3.Database(dbPath);

function computeBlobHash(ciphertext) {
    return crypto.createHash("sha256").update(ciphertext).digest("hex");
}

sqliteDb.serialize(() => {
    sqliteDb.run("PRAGMA journal_mode = WAL;");
    sqliteDb.run("PRAGMA busy_timeout = 5000;");
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS file_snapshots (
            file_id     TEXT        NOT NULL,
            branch_id   TEXT        NOT NULL DEFAULT 'main',
            data        TEXT        NOT NULL,
            updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (file_id, branch_id)
        );
    `);
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS encrypted_blobs (
            hash        TEXT        PRIMARY KEY,
            ciphertext  TEXT        NOT NULL,
            size_bytes  INTEGER     NOT NULL,
            is_binary   INTEGER     NOT NULL DEFAULT 0,
            created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS live_keyframes (
            room_key    TEXT        PRIMARY KEY,
            blob_hash   TEXT        NOT NULL REFERENCES encrypted_blobs(hash),
            updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS branch_manifests (
            id          TEXT        PRIMARY KEY,
            project_id  TEXT        NOT NULL,
            branch_id   TEXT        NOT NULL,
            tree_json   TEXT        NOT NULL DEFAULT '{}',
            updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (project_id, branch_id)
        );
    `);
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS commits_v2 (
            id                TEXT        PRIMARY KEY,
            project_id        TEXT        NOT NULL,
            branch_id         TEXT        NOT NULL,
            parent_commit_id  TEXT,
            user_id           TEXT,
            message           TEXT        NOT NULL,
            tree_manifest     TEXT        NOT NULL DEFAULT '{}',
            created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
    sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS commit_file_deltas (
            id                TEXT        PRIMARY KEY,
            commit_id         TEXT        NOT NULL REFERENCES commits_v2(id) ON DELETE CASCADE,
            file_id           TEXT        NOT NULL,
            file_path         TEXT        NOT NULL,
            change_type       TEXT        NOT NULL DEFAULT 'modified',
            blob_hash         TEXT        REFERENCES encrypted_blobs(hash),
            encrypted_patch   TEXT,
            parent_delta_id   TEXT        REFERENCES commit_file_deltas(id),
            is_keyframe       INTEGER     NOT NULL DEFAULT 0,
            chain_depth       INTEGER     NOT NULL DEFAULT 0
        );
    `, (err) => {
        if (err) console.error("[sqlite] Tri-Engine storage init error:", err.message);
        else console.log("[sqlite] Tri-Engine storage tables ready");
    });
});

let usePg = false;
let pgPool = null;

const pgConnectionString = process.env.DATABASE_URL_PG || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/nulltor";
try {
    const { Pool } = require("pg");
    pgPool = new Pool({ connectionString: pgConnectionString, connectionTimeoutMillis: 10000 });
    pgPool.query(`
        CREATE TABLE IF NOT EXISTS file_snapshots (
            file_id     TEXT        NOT NULL,
            branch_id   TEXT        NOT NULL DEFAULT 'main',
            data        TEXT        NOT NULL,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (file_id, branch_id)
        );
        CREATE TABLE IF NOT EXISTS encrypted_blobs (
            hash        VARCHAR(64) PRIMARY KEY,
            ciphertext  TEXT        NOT NULL,
            size_bytes  INTEGER     NOT NULL,
            is_binary   BOOLEAN     NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS live_keyframes (
            room_key    VARCHAR(255) PRIMARY KEY,
            blob_hash   VARCHAR(64)  NOT NULL REFERENCES encrypted_blobs(hash),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
    `).then(() => {
        usePg = true;
        console.log("[pg] Tri-Engine storage tables ready & verified");
        syncPgToSqlite();
    }).catch(err => {
        console.warn("[pg] Warning during initial PG table verify, pool will still attempt on-demand queries:", err.message);
        usePg = true; // Still allow pool queries to attempt on-demand
    });
} catch (err) {
    console.error("[pg] Failed to create PG pool:", err.message);
    usePg = false;
}

async function syncPgToSqlite() {
    if (!pgPool) return;
    try {
        console.log("[db-mirror] Starting PostgreSQL -> SQLite background mirror...");
        // 1. Mirror encrypted_blobs
        const blobsRes = await pgPool.query("SELECT hash, ciphertext, size_bytes, is_binary, created_at FROM encrypted_blobs");
        if (blobsRes.rows && blobsRes.rows.length > 0) {
            sqliteDb.serialize(() => {
                const stmt = sqliteDb.prepare(`
                    INSERT OR REPLACE INTO encrypted_blobs (hash, ciphertext, size_bytes, is_binary, created_at)
                    VALUES (?, ?, ?, ?, ?)
                `);
                for (const row of blobsRes.rows) {
                    stmt.run(row.hash, row.ciphertext, row.size_bytes, row.is_binary ? 1 : 0, row.created_at ? new Date(row.created_at).toISOString() : null);
                }
                stmt.finalize();
            });
            console.log(`[db-mirror] Mirrored ${blobsRes.rows.length} encrypted blobs to SQLite`);
        }

        // 2. Mirror live_keyframes
        const keyframesRes = await pgPool.query("SELECT room_key, blob_hash, updated_at FROM live_keyframes");
        if (keyframesRes.rows && keyframesRes.rows.length > 0) {
            sqliteDb.serialize(() => {
                const stmt = sqliteDb.prepare(`
                    INSERT OR REPLACE INTO live_keyframes (room_key, blob_hash, updated_at)
                    VALUES (?, ?, ?)
                `);
                for (const row of keyframesRes.rows) {
                    stmt.run(row.room_key, row.blob_hash, row.updated_at ? new Date(row.updated_at).toISOString() : null);
                }
                stmt.finalize();
            });
            console.log(`[db-mirror] Mirrored ${keyframesRes.rows.length} live keyframes to SQLite`);
        }

        // 3. Mirror file_snapshots
        const snapsRes = await pgPool.query("SELECT file_id, branch_id, data, updated_at FROM file_snapshots");
        if (snapsRes.rows && snapsRes.rows.length > 0) {
            sqliteDb.serialize(() => {
                const stmt = sqliteDb.prepare(`
                    INSERT OR REPLACE INTO file_snapshots (file_id, branch_id, data, updated_at)
                    VALUES (?, ?, ?, ?)
                `);
                for (const row of snapsRes.rows) {
                    stmt.run(row.file_id, row.branch_id, row.data, row.updated_at ? new Date(row.updated_at).toISOString() : null);
                }
                stmt.finalize();
            });
            console.log(`[db-mirror] Mirrored ${snapsRes.rows.length} file snapshots to SQLite`);
        }
        console.log("[db-mirror] PostgreSQL -> SQLite mirror complete. SQLite is fully synchronized.");
    } catch (err) {
        console.warn("[db-mirror] Warning during PostgreSQL -> SQLite sync:", err.message);
    }
}

async function loadSnapshot(fileId, branchId = 'main') {
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_:-]/g, "");
    const safeBranchId = branchId.replace(/[^a-zA-Z0-9_-]/g, "") || 'main';
    if (!safeFileId) return null;

    const roomKey = `${safeFileId}::${safeBranchId}`;

    if (pgPool) {
        try {
            // 1. Try exact live_keyframes CAS lookup, or canonical main branch, or any recent keyframe for this file
            let res = await pgPool.query(
                `SELECT eb.ciphertext as data 
                 FROM live_keyframes lk
                 JOIN encrypted_blobs eb ON lk.blob_hash = eb.hash
                 WHERE lk.room_key = $1
                    OR lk.room_key = $2
                    OR split_part(lk.room_key, '::', 1) = $3
                 ORDER BY (lk.room_key = $1) DESC, (lk.room_key = $2) DESC, lk.updated_at DESC
                 LIMIT 1`,
                [roomKey, `${safeFileId}::main`, safeFileId]
            );
            if (res.rows.length > 0 && res.rows[0].data) {
                console.log(`[pg] Loaded snapshot from live_keyframes for room ${roomKey} (${res.rows[0].data.length} bytes)`);
                return res.rows[0].data;
            }

            // 2. Try file_snapshots table (exact branch, main branch, or any branch for this file)
            res = await pgPool.query(
                `SELECT data FROM file_snapshots 
                 WHERE (file_id = $1 AND (branch_id = $2 OR branch_id = 'main'))
                    OR file_id = $1
                 ORDER BY (branch_id = $2) DESC, (branch_id = 'main') DESC, updated_at DESC
                 LIMIT 1`,
                [safeFileId, safeBranchId]
            );
            if (res.rows.length > 0 && res.rows[0].data) {
                console.log(`[pg] Loaded snapshot from file_snapshots for room ${roomKey} (${res.rows[0].data.length} bytes)`);
                return res.rows[0].data;
            }
            
            // 3. Fallback: lookup corresponding file on main branch by name in directories table
            if (safeBranchId !== 'main') {
                const dirRes = await pgPool.query(
                    `SELECT fs.data 
                     FROM directories d_sub
                     JOIN directories d_main ON d_sub.name = d_main.name AND d_sub.project_id = d_main.project_id
                     JOIN branches b_main ON d_main.branch_id = b_main.id AND b_main.type = 'main'
                     JOIN file_snapshots fs ON (fs.file_id = d_main.id::text OR fs.file_id = d_main.id) AND (fs.branch_id = b_main.id::text OR fs.branch_id = 'main')
                     WHERE (d_sub.id = $1::uuid OR d_sub.id::text = $1)
                     LIMIT 1`,
                    [safeFileId]
                ).catch(() => ({ rows: [] }));

                if (dirRes.rows && dirRes.rows.length > 0 && dirRes.rows[0].data) {
                    await saveSnapshot(safeFileId, safeBranchId, dirRes.rows[0].data);
                    return dirRes.rows[0].data;
                }
            }

            // 4. Ultimate Fail-Safe: Recover from immutable commits history
            const commitRes = await pgPool.query(
                `SELECT snapshot as data FROM commits 
                 WHERE (file_id = $1 OR file_id = $2) AND snapshot IS NOT NULL AND length(snapshot) > 50
                 ORDER BY created_at DESC LIMIT 1`,
                [safeFileId, safeFileId.split('::')[0]]
            ).catch(() => ({ rows: [] }));

            if (commitRes.rows && commitRes.rows.length > 0 && commitRes.rows[0].data) {
                console.log(`[pg] Ultimate fail-safe: Recovered snapshot from commits table for ${roomKey} (${commitRes.rows[0].data.length} bytes)`);
                await saveSnapshot(safeFileId, safeBranchId, commitRes.rows[0].data);
                return commitRes.rows[0].data;
            }
        } catch (err) {
            console.error("[pg] loadSnapshot error:", err.message);
        }
    }

    // SQLite fallback
    return new Promise((resolve) => {
        sqliteDb.get(
            `SELECT eb.ciphertext as data 
             FROM live_keyframes lk
             JOIN encrypted_blobs eb ON lk.blob_hash = eb.hash
             WHERE lk.room_key = ? OR lk.room_key = ?
             ORDER BY (lk.room_key = ?) DESC
             LIMIT 1`,
            [roomKey, `${safeFileId}::main`, roomKey],
            (err, row) => {
                if (!err && row && row.data) {
                    resolve(row.data);
                    return;
                }
                sqliteDb.get(
                    `SELECT data FROM file_snapshots 
                     WHERE (file_id = ? AND (branch_id = ? OR branch_id = 'main')) OR file_id = ?
                     ORDER BY (branch_id = ?) DESC LIMIT 1`,
                    [safeFileId, safeBranchId, safeFileId, safeBranchId],
                    (err2, row2) => {
                        if (err2) {
                            console.error("[sqlite] loadSnapshot error:", err2.message);
                            resolve(null);
                        } else if (row2 && row2.data) {
                            resolve(row2.data);
                        } else {
                            resolve(null);
                        }
                    }
                );
            }
        );
    });
}

async function saveSnapshot(fileId, branchId = 'main', data) {
    const safeFileId = fileId.replace(/[^a-zA-Z0-9_:-]/g, "");
    const safeBranchId = branchId.replace(/[^a-zA-Z0-9_-]/g, "") || 'main';
    if (!safeFileId || !data) return;

    const blobHash = computeBlobHash(data);
    const sizeBytes = Buffer.byteLength(data, 'utf8');
    const roomKey = `${safeFileId}::${safeBranchId}`;

    if (pgPool) {
        try {
            await pgPool.query(
                `INSERT INTO encrypted_blobs (hash, ciphertext, size_bytes, is_binary, created_at)
                 VALUES ($1, $2, $3, FALSE, NOW())
                 ON CONFLICT (hash) DO NOTHING`,
                [blobHash, data, sizeBytes]
            );
            await pgPool.query(
                `INSERT INTO live_keyframes (room_key, blob_hash, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (room_key) DO UPDATE
                 SET blob_hash = EXCLUDED.blob_hash, updated_at = NOW()`,
                [roomKey, blobHash]
            );
            await pgPool.query(
                `INSERT INTO file_snapshots (file_id, branch_id, data, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (file_id, branch_id) DO UPDATE
                 SET data = EXCLUDED.data, updated_at = NOW()`,
                [safeFileId, safeBranchId, data]
            );
        } catch (err) {
            console.error("[pg] saveSnapshot error:", err.message);
        }
    }

    sqliteDb.serialize(() => {
        sqliteDb.run(
            `INSERT OR IGNORE INTO encrypted_blobs (hash, ciphertext, size_bytes, is_binary, created_at)
             VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [blobHash, data, sizeBytes]
        );
        sqliteDb.run(
            `INSERT INTO live_keyframes (room_key, blob_hash, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(room_key) DO UPDATE
             SET blob_hash = excluded.blob_hash, updated_at = CURRENT_TIMESTAMP`,
            [roomKey, blobHash]
        );
        sqliteDb.run(
            `INSERT INTO file_snapshots (file_id, branch_id, data, updated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(file_id, branch_id) DO UPDATE
             SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
            [safeFileId, safeBranchId, data],
            (err) => {
                if (err) console.error("[sqlite] saveSnapshot error:", err.message);
            }
        );
    });
}

const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");
const crypto_builtin = require("crypto");

const app = express();

// ── Security Headers (helmet) ────────────────────────────────────────────────
// Applied before any route middleware to ensure headers are always present.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdn.jsdelivr.net",
                "https://cdn.botpress.cloud",
                "https://files.bpcontent.cloud",
                "https://*.botpress.cloud",
                "https://*.bpcontent.cloud",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdn.botpress.cloud",
                "https://files.bpcontent.cloud",
                "https://*.botpress.cloud",
                "https://*.bpcontent.cloud",
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:",
                "https://cdn.jsdelivr.net",
                "https://cdn.botpress.cloud",
                "https://files.bpcontent.cloud",
            ],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:", "https:"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'self'", "https://cdn.botpress.cloud", "https://*.botpress.cloud"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null,
        },
    },
    hsts: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false,
    xContentTypeOptions: true,
    referrerPolicy: { policy: "same-origin" },
}));

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 8e6,  // 8 MB — encrypted Yjs snapshots can be large
    pingTimeout: 30000,
    pingInterval: 10000,
    cors: { origin: "*" }
});

// ── Socket.IO JWT Authentication Middleware ──────────────────────────────────
// Every socket connection must present a valid JWT before any event is processed.
// Token may come from:
//   1. socket.handshake.auth.token   (preferred, set by frontend auth)
//   2. socket.handshake.query.token  (fallback for legacy clients)
// Sockets that fail verification receive an error and are disconnected.
const JWT_SECRET = process.env.JWT_SECRET_KEY || "change-me-to-a-random-64-char-secret";

function verifySocketJwt(token) {
    if (!token || typeof token !== "string") return null;
    try {
        // Simple HS256 JWT verification without a heavy library dependency
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const sig = crypto_builtin
            .createHmac("sha256", JWT_SECRET)
            .update(parts[0] + "." + parts[1])
            .digest("base64url");
        if (sig !== parts[2]) return null;
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (!payload.sub || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) return null;
        return payload;
    } catch {
        return null;
    }
}

io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    // Also allow cookie-based auth (token passed as cookie on same origin)
    const cookieHeader = socket.handshake.headers?.cookie || "";
    const cookieToken = cookieHeader
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith("nulltor_access_token="))
        ?.split("=")[1];

    const effectiveToken = token || cookieToken;
    const payload = verifySocketJwt(effectiveToken);

    if (!payload) {
        socket.user = { id: "anonymous", role: "member", username: "guest" };
        return next();
    }

    socket.user = { id: payload.sub, role: payload.role, username: payload.username };
    next();
});


// ── Reverse Proxy to FastAPI Backend ──────────────────────────────────────
const BACKEND_PORT = process.env.BACKEND_PORT || 8001;
const BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${BACKEND_PORT}`;

const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: false,
    pathRewrite: (pathname) => `/api${pathname}`,
    logLevel: "warn",
});

const docsProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: false,
    pathRewrite: (pathname) => `/docs${pathname}`,
    logLevel: "warn",
});

const wsProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true,
    logLevel: "warn",
});

// Route API, docs, and terminal WebSockets to FastAPI
app.use("/api", apiProxy);
app.use("/docs", docsProxy);
app.use("/openapi.json", docsProxy);
app.use("/redoc", docsProxy);

// Handle WebSocket upgrade for terminal xterm execution
server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/ws")) {
        wsProxy.upgrade(req, socket, head);
    }
});

// ── Static Files & SPA Fallback ───────────────────────────────────────────
const reactBuildPath = path.join(__dirname, "public_react");
app.use(express.static(reactBuildPath, {
    setHeaders: (res, filePath) => {
        if (filePath.includes("assets")) {
            res.set("Cache-Control", "public, max-age=31536000, immutable");
        } else {
            res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        }
    }
}));

const MAX_UPDATE_SIZE = 8 * 1024 * 1024;  // 8 MB — raised from 512 KB; encrypted Yjs snapshots can be large
const RATE_LIMIT_MS = 16;
const MAX_PEERS = 32;

// Maps fileId -> Set of socket IDs
const roomMembers = new Map();
// Maps socket.id -> { fileId, name, color }
const peerInfo = new Map();
// Maps socket.id -> timestamp
const lastUpdateAt = new Map();
// In-memory last-snapshot cache: roomKey -> encryptedPayload
// Updated on every y-snapshot event so reconnecting peers get instant state
const lastSnapshotCache = new Map();
// Debounce database disk persistence to avoid SQLite table locks during typing
const pendingDbSaves = new Map();

function scheduleDbSnapshot(fileId, branchId, payload, immediate = false) {
    const key = `${fileId}::${branchId}`;
    if (pendingDbSaves.has(key)) {
        clearTimeout(pendingDbSaves.get(key).timer);
    }
    if (immediate) {
        pendingDbSaves.delete(key);
        saveSnapshot(fileId, branchId, payload).catch(err => {
            console.error("[db] immediate saveSnapshot error:", err.message);
        });
        return;
    }
    const timer = setTimeout(async () => {
        pendingDbSaves.delete(key);
        try {
            await saveSnapshot(fileId, branchId, payload);
        } catch (err) {
            console.error("[db] debounced saveSnapshot error:", err.message);
        }
    }, 1000);
    pendingDbSaves.set(key, { timer, fileId, branchId, payload });
}

async function flushPendingDbSnapshot(key) {
    if (!pendingDbSaves.has(key)) return;
    const item = pendingDbSaves.get(key);
    clearTimeout(item.timer);
    pendingDbSaves.delete(key);
    try {
        await saveSnapshot(item.fileId, item.branchId, item.payload);
        console.log(`[db] Flushed pending snapshot for ${key}`);
    } catch (err) {
        console.error(`[db] Error flushing pending snapshot for ${key}:`, err.message);
    }
}

function broadcastPresence(fileId) {
    const members = roomMembers.get(fileId);
    if (!members) return;

    const uniquePeers = new Map();
    [...members].forEach((id) => {
        const info = peerInfo.get(id) || {};
        const name = info.name || "Peer";
        if (!uniquePeers.has(name)) {
            uniquePeers.set(name, {
                id,
                name: name,
                isHost: false,
                color: info.color || "#6366f1"
            });
        }
    });

    io.to(fileId).emit("presence", { peers: Array.from(uniquePeers.values()), hostId: null });
}

io.on("connection", (socket) => {
    console.log("[connect]", socket.id);

    socket.on("join-file", async ({ fileId, branchId }) => {
        if (!fileId || typeof fileId !== 'string') return;

        const safeBranchId = (branchId && typeof branchId === 'string')
            ? branchId.replace(/[^a-zA-Z0-9_-]/g, '') || 'main'
            : 'main';
        const roomKey = `${fileId}::${safeBranchId}`;
        const branchRoom = `branch::${safeBranchId}`;

        // ── MAX_PEERS enforcement ─────────────────────────────────
        let members = roomMembers.get(roomKey);
        if (members && members.size >= MAX_PEERS) {
            socket.emit("error", { message: `Room is full (max ${MAX_PEERS} peers).` });
            return;
        }

        socket.join(roomKey);
        socket.join(branchRoom);
        peerInfo.set(socket.id, { fileId: roomKey, branchRoom, rawFileId: fileId, branchId: safeBranchId, name: "Peer", color: "#6366f1", userId: socket.user?.id });

        if (!members) {
            members = new Set();
            roomMembers.set(roomKey, members);
        }
        members.add(socket.id);

        console.log(`[join-file] ${socket.id} (user:${socket.user?.id}) joined ${roomKey}`);

        const snapshot = await loadSnapshot(fileId, safeBranchId);
        socket.emit("approved", {
            snapshot,
            salt: null // Salt fetched from API by client
        });

        broadcastPresence(roomKey);
    });


    socket.on("register-peer", ({ name, color, userId }) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;

        info.name = String(name || "Peer").slice(0, 32);
        info.color = String(color || "#6366f1").slice(0, 7);
        info.userId = userId ? String(userId) : null;
        peerInfo.set(socket.id, info);
        
        if (userId) {
            socket.join(`user::${userId}`);
        }

        broadcastPresence(info.fileId);
        
        // Notify others so they can initiate WebRTC
        socket.to(info.fileId).emit("peer-joined", {
            id: socket.id,
            name: info.name
        });
    });

    socket.on("subroom-invite", ({ targetUserId, projectId, branchId, branchName }) => {
        // Always use server-verified identity — ignore client-supplied inviterName/inviterUserId
        // to prevent social engineering attacks where a bad actor spoofs another user's identity.
        const senderInfo = peerInfo.get(socket.id);
        const inviterUserId = senderInfo?.userId || socket.user?.id;
        const inviterName = senderInfo?.name || socket.user?.username || "A team member";

        if (targetUserId) {
            io.to(`user::${targetUserId}`).emit("subroom-invite-received", {
                projectId,
                branchId,
                branchName,
                inviterUserId,
                inviterId: socket.id,
                inviterName,
                createdAt: new Date().toISOString()
            });
        }
    });


    socket.on("subroom-invite-response", ({ targetUserId, inviterUserId, inviterId, accepted, projectId, branchId, branchName, responderName }) => {
        const payload = {
            targetUserId,
            accepted,
            projectId,
            branchId,
            branchName,
            responderName: responderName || "Peer"
        };
        if (inviterUserId) {
            io.to(`user::${inviterUserId}`).emit("subroom-invite-response-received", payload);
        } else if (inviterId) {
            io.to(inviterId).emit("subroom-invite-response-received", payload);
        }
    });

    socket.on("sync-branch-room", async ({ branchId, activeFileId, activeSnapshot }) => {
        const safeBranchId = (branchId && typeof branchId === 'string')
            ? branchId.replace(/[^a-zA-Z0-9_-]/g, '') || 'main'
            : 'main';
        const branchRoom = `branch::${safeBranchId}`;

        // Invalidate in-memory lastSnapshotCache for all files on this branch
        for (const [key] of lastSnapshotCache.entries()) {
            if (key.endsWith(`::${safeBranchId}`)) {
                lastSnapshotCache.delete(key);
            }
        }

        // Warm cache if active snapshot was passed
        if (activeFileId && activeSnapshot) {
            const roomKey = `${activeFileId}::${safeBranchId}`;
            lastSnapshotCache.set(roomKey, activeSnapshot);
            // Broadcast the new snapshot to all peers currently in this file room
            io.to(roomKey).emit("sync-response", { snapshot: activeSnapshot });
        }

        // Notify all sockets in this branch that the branch has synced
        io.to(branchRoom).emit("branch-updated", { branchId: safeBranchId, activeFileId });
    });

    socket.on("force-reload-file", async ({ fileId, branchId }) => {
        if (!fileId) return;
        const safeBranchId = branchId ? String(branchId).replace(/[^a-zA-Z0-9_-]/g, '') || 'main' : 'main';
        const roomKey = `${fileId}::${safeBranchId}`;
        lastSnapshotCache.delete(roomKey);
        const snap = await loadSnapshot(fileId, safeBranchId);
        if (snap) {
            lastSnapshotCache.set(roomKey, snap);
            io.to(roomKey).emit("sync-response", { snapshot: snap });
        }
    });

    socket.on("y-delta", (payload) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        
        if (!payload || typeof payload !== "string") return;
        if (payload.length > MAX_UPDATE_SIZE) return;

        const now = Date.now();
        const last = lastUpdateAt.get(socket.id) || 0;
        if (now - last < RATE_LIMIT_MS) return;
        lastUpdateAt.set(socket.id, now);

        socket.to(info.fileId).emit("y-delta", payload);
    });

    socket.on("y-snapshot", async (payload, meta = {}) => {
        const info = peerInfo.get(socket.id);
        if (!info) {
            console.warn(`[y-snapshot] IGNORED — socket ${socket.id} not registered (join-file not yet processed)`);
            return;
        }
        
        let rawPayload = payload;
        let isImmediate = Boolean(meta && meta.immediate);

        if (typeof payload === "object" && payload !== null && payload.payload) {
            if (payload.immediate) isImmediate = true;
            rawPayload = payload.payload;
        }

        if (!rawPayload || typeof rawPayload !== "string") return;
        if (rawPayload.length > MAX_UPDATE_SIZE) {
            console.warn(`[y-snapshot] DROPPED payload too large: ${rawPayload.length} bytes (limit: ${MAX_UPDATE_SIZE}). Room: ${info.fileId}`);
            return;
        }

        console.log(`[y-snapshot] saving room=${info.fileId} fileId=${info.rawFileId} branchId=${info.branchId} size=${rawPayload.length} immediate=${isImmediate}`);

        // Keep in-memory cache hot for instant reconnect delivery
        lastSnapshotCache.set(info.fileId, rawPayload);
        scheduleDbSnapshot(info.rawFileId || info.fileId, info.branchId || 'main', rawPayload, isImmediate);
    });

    socket.on("request-sync", async () => {
        const info = peerInfo.get(socket.id);
        if (!info) return;

        // 1. Try in-memory cache first (fastest — covers reconnect within same server session)
        const cached = lastSnapshotCache.get(info.fileId);
        if (cached) {
            socket.emit("sync-response", { snapshot: cached });
            return;
        }

        // 2. Load from DB using rawFileId + branchId (not the composite room key)
        const snap = await loadSnapshot(info.rawFileId || info.fileId, info.branchId || 'main');
        if (snap) {
            lastSnapshotCache.set(info.fileId, snap); // warm the cache
            socket.emit("sync-response", { snapshot: snap });
        } else {
            // 3. Ask a live peer to offer their state
            socket.to(info.fileId).emit("sync-needed", { requesterId: socket.id });
        }
    });

    socket.on("y-sync-offer", ({ targetId, payload }) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        if (!payload || typeof payload !== "string") return;
        if (payload.length > MAX_UPDATE_SIZE) return;

        // Cross-room injection fix: only allow delivery to a peer in the same file room.
        const targetInfo = peerInfo.get(targetId);
        if (!targetInfo || targetInfo.fileId !== info.fileId) return;

        io.to(targetId).emit("sync-response", { snapshot: payload });
    });


    socket.on("awareness-update", (payload) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        if (!payload || typeof payload !== "string") return;
        if (payload.length > 8192) return;

        socket.to(info.fileId).emit("awareness-update", {
            from: socket.id,
            payload
        });
    });

    socket.on("cursor-update", ({ line, column }) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        if (typeof line !== "number" || typeof column !== "number") return;

        socket.to(info.fileId).emit("cursor-update", {
            socketId: socket.id,
            name: info.name || "Peer",
            color: info.color || "#6366f1",
            line: Math.max(1, Math.floor(line)),
            column: Math.max(1, Math.floor(column)),
        });
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────────
    socket.on("webrtc-join-call", () => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        const targetRoom = info.branchRoom || info.fileId;
        socket.to(targetRoom).emit("webrtc-join-call", {
            senderId: socket.id
        });
    });

    socket.on("webrtc-signal", ({ targetId, signal }) => {
        const info = peerInfo.get(socket.id);
        if (!info) return;
        if (!targetId || !signal) return;
        
        // Forward the signal to the target peer securely
        io.to(targetId).emit("webrtc-signal", {
            senderId: socket.id,
            signal
        });
    });



    socket.on("disconnect", () => {
        const info = peerInfo.get(socket.id);
        if (info) {
            // Flush any pending debounced database write for this room immediately
            const saveKey = `${info.rawFileId || info.fileId}::${info.branchId || 'main'}`;
            flushPendingDbSnapshot(saveKey);

            const members = roomMembers.get(info.fileId);
            if (members) {
                members.delete(socket.id);
                if (members.size === 0) {
                    // Room is now empty — keep lastSnapshotCache alive but clear roomMembers
                    // so next joiner still gets the snapshot from cache/DB
                    roomMembers.delete(info.fileId);
                } else {
                    broadcastPresence(info.fileId);
                }
            }
            io.to(info.fileId).emit("peer-left", { id: socket.id });
        }
        
        peerInfo.delete(socket.id);
        lastUpdateAt.delete(socket.id);
        
        console.log("Disconnected:", socket.id);
    });
});

// ── SPA Fallback for React UI Routing (Express 5 compatible) ──────────────
app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io") || req.path.startsWith("/ws")) {
        return next();
    }
    const indexPath = path.join(reactBuildPath, "index.html");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.sendFile(indexPath, (err) => {
        if (err) next();
    });
});

const PORT = process.env.PORT || 3330;

let retryCount = 0;
server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && retryCount < 3) {
        retryCount++;
        console.warn(`[Gateway] Port ${PORT} busy (attempt ${retryCount}/3), auto-clearing lingering processes...`);
        try {
            const { spawnSync } = require("child_process");
            spawnSync("node", [path.join(__dirname, "scripts", "stop.js")], { stdio: "ignore" });
        } catch (_) {}
        setTimeout(() => {
            try { server.close(); } catch {}
            server.listen(PORT, "0.0.0.0");
        }, 1500);
        return;
    }
    if (err.code === "EADDRINUSE") {
        console.error(`\nPort ${PORT} is already in use.`);
        console.error("Another server is already running on this port — stop it first:\n");
        console.error("  npm run stop\n");
        process.exit(1);
    }
    throw err;
});

server.listen(PORT, "0.0.0.0", () => {
    const os = require("os");
    // Detect best LAN IP for display
    let lanIp = "0.0.0.0";
    try {
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === "IPv4" && !net.internal) {
                    lanIp = net.address;
                    break;
                }
            }
            if (lanIp !== "0.0.0.0") break;
        }
    } catch (_) {}

    console.log(`\n======================================================`);
    console.log(`  NULLTOR SECURE COLLABORATIVE PLATFORM READY`);
    console.log(`  Unified Single-Port Access: http://localhost:${PORT}`);
    console.log(`  On your Local Network:     http://${lanIp}:${PORT}`);
    console.log(`  mDNS (zero-config):        http://nulltor.local:${PORT}`);
    console.log(`======================================================\n`);

    // ── mDNS / Bonjour LAN Discovery ─────────────────────────────────────
    // Advertise nulltor.local so other LAN devices can find the server
    // without needing to know the host IP address.
    try {
        const mdns = require("multicast-dns")();
        const localIp = lanIp;
        mdns.on("query", (query) => {
            for (const question of query.questions) {
                if (
                    question.name === "nulltor.local" ||
                    question.name === "nulltor.local."
                ) {
                    mdns.respond([
                        {
                            name: "nulltor.local",
                            type: "A",
                            ttl: 300,
                            data: localIp,
                        },
                    ]);
                }
            }
        });
        console.log(`[mDNS] Advertising nulltor.local → ${localIp}:${PORT}`);
    } catch (e) {
        console.warn(`[mDNS] Disabled (run: npm install multicast-dns): ${e.message}`);
    }
});
