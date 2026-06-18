import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';
import { checkBodyImage } from '../lib/validateImage.js';
import { validate } from '../middleware/validate.js';
import { createPetSchema } from '../validators/careitem.validators.js';

const petOwner = ownershipGuard('pet');
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const myPets = await prisma.pet.findMany({ where: { ownerId: req.user?.id } });
  res.json(myPets);
});

router.post('/', validate(createPetSchema), async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkBodyImage(req, res)) return;

  // Prisma's nullable Json field rejects a bare JS null — omit instead.
  if (req.body.careDetails == null) delete req.body.careDetails;

  const newPet = await prisma.pet.create({
    data: {
      ...req.body,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  res.status(201).json(newPet);
});

router.put('/:id', petOwner, async (req, res) => {
  const id = req.params.id as string;

if (!checkBodyImage(req, res)) return;

  delete req.body.createdAt;
  delete req.body.ownerId;

  const updatedPet = await prisma.pet.update({
    where: { id },
    data: { ...req.body, updatedAt: new Date().toISOString() },
  });
  res.json(updatedPet);
});

router.delete('/:id', petOwner, async (req, res) => {
  const id = req.params.id as string;

await prisma.pet.delete({
    where: { id }
  });

  res.status(204).send();
});

export { router as petsRouter };
