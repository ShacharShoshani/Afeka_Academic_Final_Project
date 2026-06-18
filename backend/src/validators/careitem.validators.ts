import { z } from 'zod';

const petTypes = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles'] as const;
const animalSizes = ['small', 'medium', 'large'] as const;
const friendliness = ['friendly', 'cautious', 'unknown'] as const;

// All sections optional — mirrors PetCareDetails in @livin/common. Sensitive blob,
// stripped from public responses by PUBLIC_PET_SELECT / flattenJob.
const str = z.string().max(2000).optional();
const careDetailsSchema = z
  .object({
    medical: z
      .object({
        vetName: str,
        vetClinicAddress: str,
        vetPhone: str,
        emergencyClinic: str,
        conditions: str,
        medications: str,
        medicationInstructions: str,
        vaccinationNotes: str,
      })
      .optional(),
    emergencyContact: z.object({ name: str, phone: str }).optional(),
    feeding: z
      .object({
        schedule: str,
        amount: str,
        foodType: str,
        treatsAllowed: z.boolean().optional(),
        treatInstructions: str,
        foodAllergies: str,
        waterBowlLocation: str,
        waterInstructions: str,
      })
      .optional(),
    behavior: z
      .object({
        triggers: str,
        stressSigns: str,
        hidingPlaces: str,
        houseRules: str,
        canGoOnFurniture: z.boolean().optional(),
        sleepingLocation: str,
        goodWithPeople: z.boolean().optional(),
        goodWithChildren: z.boolean().optional(),
        goodWithAnimals: z.boolean().optional(),
        needsSupervision: z.boolean().optional(),
      })
      .optional(),
    dogRoutine: z
      .object({
        walksPerDay: str,
        preferredWalkTimes: str,
        pullsOnLeash: z.boolean().optional(),
        reactionToOtherDogs: str,
        canBeOffLeash: z.boolean().optional(),
        leashInstructions: str,
      })
      .optional(),
    catRoutine: z
      .object({
        litterBoxLocation: str,
        cleaningFrequency: str,
        litterDisposal: str,
        windowBalconyRules: str,
        indoorOutdoor: str,
        hidingPlaces: str,
      })
      .optional(),
    plantCare: z
      .object({
        plantType: str,
        wateringFrequency: str,
        waterAmount: str,
        sunlight: str,
        indoorOutdoor: str,
        fertilizer: str,
        sensitiveNotes: str,
        specialInstructions: str,
      })
      .optional(),
  })
  .strip();

// image is validated separately by checkBodyImage(); accept any string here.
export const createPetSchema = z.object({
  name: z.string().trim().max(100).default(''),
  type: z.enum(petTypes),
  size: z.enum(animalSizes).default('medium'),
  specialNeeds: z.string().max(2000).default(''),
  image: z.string().default(''),
  estimatedBirthDate: z.string().nullable().optional(),
  friendliness: z.enum(friendliness).nullable().optional(),
  allergies: z.string().max(2000).default(''),
  description: z.string().max(2000).default(''),
  careDetails: careDetailsSchema.nullable().optional(),
});

export const createPlantSchema = z.object({
  name: z.string().trim().max(100).default(''),
  specialNeeds: z.string().max(2000).default(''),
  image: z.string().default(''),
  estimatedBirthDate: z.string().nullable().optional(),
  description: z.string().max(2000).default(''),
  careDetails: careDetailsSchema.nullable().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreatePlantInput = z.infer<typeof createPlantSchema>;
