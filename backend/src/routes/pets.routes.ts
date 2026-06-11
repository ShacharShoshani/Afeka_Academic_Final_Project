import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';
import { checkBodyImage } from '../lib/validateImage.js';

const petOwner = ownershipGuard('pet');
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const myPets = await prisma.pet.findMany({ where: { ownerId: req.user?.id } });
  res.json(myPets);
});

router.post('/', async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkBodyImage(req, res)) return;

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

  if (!id) {
    return res.status(400).json({ message: 'Pet ID is required' });
  }

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

  if (!id) {
    return res.status(400).json({ message: 'Pet ID is required' });
  }

  await prisma.pet.delete({
    where: { id }
  });

  res.status(204).send();
});

export { router as petsRouter };
