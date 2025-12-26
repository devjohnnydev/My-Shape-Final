import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      session: any;
    }
  }
}

export async function registerAdminAuth(app: Express): Promise<void> {
  // Admin login endpoint
  app.post("/api/auth/admin-login", async (req: any, res: any) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email e senha são obrigatórios" });
      }

      // Buscar admin
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!adminUser) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!adminUser.isAdmin) {
        return res
          .status(403)
          .json({ message: "Acesso apenas para administradores" });
      }

      // Verificação simplificada: apenas email e senha corretos
      if (email === "admin@myshape.com" && password === "admin@123") {
        // Configurar sessão
        if (req.session) {
          req.session.userId = adminUser.id;
          req.session.isAdmin = true;
          req.session.save(() => {
            res.json({
              message: "Login bem-sucedido",
              userId: adminUser.id,
              email: adminUser.email,
              isAdmin: true,
            });
          });
        } else {
          res.json({
            message: "Login bem-sucedido",
            userId: adminUser.id,
            email: adminUser.email,
            isAdmin: true,
          });
        }
      } else {
        res.status(401).json({ message: "Credenciais inválidas" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // Admin logout
  app.post("/api/auth/admin-logout", (req: any, res: any) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ message: "Logout bem-sucedido" });
      });
    } else {
      res.json({ message: "Logout bem-sucedido" });
    }
  });

  // Verificar se usuário é admin
  app.get("/api/auth/check-admin", (req: any, res: any) => {
    if (req.session?.isAdmin) {
      res.json({ isAdmin: true, userId: req.session.userId });
    } else {
      res.status(401).json({ isAdmin: false });
    }
  });
}
