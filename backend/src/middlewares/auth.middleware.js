const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const redis = require("../config/redis");
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  const start = Date.now();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub || !decoded.email) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Token expirado" });
    }

    // Tenta pegar do cache mas sempre valida o role no banco
    const cacheKey = `me:${decoded.email}`;
    let dbUser = null;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        dbUser = typeof cached === "string" ? JSON.parse(cached) : cached;
        // Se o role no cache for 'authenticated', invalida o cache
        if (!dbUser.role || dbUser.role === "authenticated") {
          await redis.del(cacheKey);
          dbUser = null;
        }
      }
    } catch {}

    if (!dbUser) {
      dbUser = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: { id: true, email: true, name: true, role: true, active: true },
      });
      if (dbUser) {
        await redis.set(cacheKey, JSON.stringify(dbUser), { ex: 300 });
      }
    }

    if (!dbUser || !dbUser.active) {
      return res
        .status(401)
        .json({ message: "Usuário não encontrado ou inativo" });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: dbUser.role,
      name: dbUser.name,
      dbId: dbUser.id,
    };

    console.log(`auth.middleware — ${Date.now() - start}ms`);
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token inválido" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Sem permissão para esta ação" });
    }
    next();
  };

module.exports = { protect, requireRole };
