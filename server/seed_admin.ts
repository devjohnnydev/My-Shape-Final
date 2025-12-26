import { db } from "./db";
import { users } from "@shared/models/auth";
import { gyms } from "@shared/schema";

export async function seedAdminAndGyms() {
  try {
    console.log("🌱 Iniciando seed de dados...");
    
    // Criar academias padrão
    const existingGyms = await db.select().from(gyms);
    
    if (existingGyms.length === 0) {
      console.log("📚 Criando academias padrão...");
      await db.insert(gyms).values([
        {
          name: "Smart Fit",
          primaryColor: "#0066FF",
          secondaryColor: "#FF0000",
          partnershipType: "Premium",
        },
        {
          name: "SkyFit",
          primaryColor: "#FFD700",
          secondaryColor: "#000000",
          partnershipType: "Premium",
        },
      ]);
      console.log("✅ Academias criadas com sucesso");
    }

    // Criar admin padrão
    const allUsers = await db.select().from(users);
    const adminExists = allUsers.some((u: any) => u.email === "admin@myshape.com");

    if (!adminExists) {
      console.log("👤 Criando admin padrão...");
      await db.insert(users).values({
        email: "admin@myshape.com",
        firstName: "System",
        lastName: "Administrator",
        isAdmin: true,
        approvalStatus: "approved",
        accessLevel: "total",
        aiChatEnabled: true,
      });
      
      console.log("✅ Admin criado com sucesso");
      console.log("   📧 Email: admin@myshape.com");
      console.log("   🔑 Senha: admin@123");
    }
    
    console.log("✨ Seed completo!");
  } catch (error: any) {
    console.error("❌ Erro ao fazer seed:", error.message);
  }
}
