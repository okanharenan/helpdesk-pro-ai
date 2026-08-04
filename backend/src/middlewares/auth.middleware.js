const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Token expirado" });
    }

    // Busca role diretamente no banco sem cache
    const dbUser = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    if (!dbUser) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    req.user = {
      id: decoded.sub,
      dbId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };

    console.log(`[middleware] email: ${dbUser.email} | role: ${dbUser.role}`);
    next();
  } catch (err) {
    console.error("[middleware] erro:", err.message);
    return res.status(401).json({ message: "Token inválido" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Sem permissão" });
    }
    next();
  };

module.exports = { protect, requireRole };
