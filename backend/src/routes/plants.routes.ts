import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';
import { checkBodyImage } from '../lib/validateImage.js';
import { validate } from '../middleware/validate.js';
import { createPlantSchema } from '../validators/careitem.validators.js';

const plantOwner = ownershipGuard('plant');
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const myPlants = await prisma.plant.findMany({ where: { ownerId: req.user?.id } });
  res.json(myPlants);
});

router.post('/', validate(createPlantSchema), async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkBodyImage(req, res)) return;

  // Prisma's nullable Json field rejects a bare JS null — omit instead.
  if (req.body.careDetails == null) delete req.body.careDetails;

  const plant = await prisma.plant.create({
    data: {
      ...req.body,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  res.status(201).json(plant);
});

router.put('/:id', plantOwner, async (req, res) => {
  const id = req.params.id as string;

if (!checkBodyImage(req, res)) return;

  delete req.body.createdAt;
  delete req.body.ownerId;

  const updatedPlant = await prisma.plant.update({
    where: { id },
    data: { ...req.body, updatedAt: new Date().toISOString() },
  });
  res.json(updatedPlant);
});

router.delete('/:id', plantOwner, async (req, res) => {
  const id = req.params.id as string;

await prisma.plant.delete({
    where: { id }
  });

  res.status(204).send();
});

export { router as plantsRouter };
