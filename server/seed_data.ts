import { db } from "./db";
import { gyms, exercises, exerciseInstructions } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Seed Gyms
    const defaultGyms = [
      {
        name: 'SkyFit',
        logo: 'https://via.placeholder.com/200?text=SkyFit',
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        description: 'Academia com equipamento moderno',
      },
      {
        name: 'Smart Fit',
        logo: 'https://via.placeholder.com/200?text=SmartFit',
        primaryColor: '#DC2626',
        secondaryColor: '#EF4444',
        description: 'Academia de musculação e funcional',
      },
      {
        name: 'Gaviões',
        logo: 'https://via.placeholder.com/200?text=Gavioes',
        primaryColor: '#7C3AED',
        secondaryColor: '#A78BFA',
        description: 'Academia completa com personal',
      },
      {
        name: 'Academia em Casa',
        logo: 'https://via.placeholder.com/200?text=Casa',
        primaryColor: '#059669',
        secondaryColor: '#10B981',
        description: 'Treine com segurança em casa',
      },
    ];

    // Check if gyms exist
    const existingGyms = await db.select().from(gyms);
    
    if (existingGyms.length === 0) {
      console.log('🌱 Seeding default gyms...');
      for (const gym of defaultGyms) {
        await db.insert(gyms).values(gym).onConflictDoNothing();
      }
      console.log('✅ Gyms seeded successfully');
    } else {
      console.log('ℹ️ Gyms already exist in database');
    }

    // Seed example exercises
    const checkExercises = await db.select().from(exercises);
    if (checkExercises.length === 0) {
      console.log('🌱 Seeding example exercises...');
      
      const exercisesToSeed = [
        {
          name: 'Supino Reto',
          description: 'Exercício para peito com barra',
          muscleGroups: ['chest', 'triceps'],
          difficulty: 'intermediate',
          equipmentNeeded: ['barbell', 'bench'],
        },
        {
          name: 'Leg Press',
          description: 'Exercício para pernas',
          muscleGroups: ['quadriceps', 'glutes'],
          difficulty: 'beginner',
          equipmentNeeded: ['leg-press-machine'],
        },
      ];

      for (const exercise of exercisesToSeed) {
        await db.insert(exercises).values(exercise).onConflictDoNothing();
      }
      console.log('✅ Exercises seeded successfully');
    } else {
      console.log('ℹ️ Exercises already exist in database');
    }

  } catch (error) {
    console.error('Database seeding error:', error);
  }
}
