import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { checkBodyImage } from '../lib/validateImage.js';

const strayReporter = ownershipGuard('strayAnimal');

const router = Router();


router.get('/', async (req, res) => {
  const myStrays = await prisma.strayAnimal.findMany({ where: { reporterId: req.user?.id } });
  res.json(myStrays);
});

router.post('/', async (req, res) => {
  const reporterId = req.user?.id;

  if (!reporterId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkBodyImage(req, res)) return;

  const stray = await prisma.strayAnimal.create({
    data: {
      ...req.body,
      reporterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  res.status(201).json(stray);
});

router.put('/:id', strayReporter, async (req, res) => {
  const id = req.params.id as string;

if (!checkBodyImage(req, res)) return;

  delete req.body.createdAt;
  delete req.body.reporterId;

  const updatedStray = await prisma.strayAnimal.update({
    where: { id },
    data: { ...req.body, updatedAt: new Date().toISOString() },
  });
  res.json(updatedStray);
});

router.delete('/:id', strayReporter, async (req, res) => {
  const id = req.params.id as string;

await prisma.strayAnimal.delete({
    where: { id }
  });

  res.status(204).send();
});

export { router as strayAnimalsRouter };
