import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';
import { validateImageDataUrl, imageErrorMessage } from '../lib/validateImage.js';

const plantOwner = ownershipGuard('plant');
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const myPlants = await prisma.plant.findMany({ where: { ownerId: req.user?.id } });
  res.json(myPlants);
});

router.post('/', async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.body.image) {
    const imgErr = validateImageDataUrl(req.body.image);
    if (imgErr) return res.status(400).json({ error: imageErrorMessage(imgErr) });
  }

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

  if (!id) {
    return res.status(400).json({ message: 'Plant ID is required' });
  }

  if (req.body.image) {
    const imgErr = validateImageDataUrl(req.body.image);
    if (imgErr) return res.status(400).json({ error: imageErrorMessage(imgErr) });
  }

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

  if (!id) {
    return res.status(400).json({ message: 'Plant ID is required' });
  }

  await prisma.plant.delete({
    where: { id }
  });

  res.status(204).send();
});

export { router as plantsRouter };
