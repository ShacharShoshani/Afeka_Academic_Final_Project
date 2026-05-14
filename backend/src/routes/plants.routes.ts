import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const STUB_PLANTS = [
  {
    id: 'plant-stub-1',
    ownerId: 'stub-owner',
    name: 'Monstera',
    specialNeeds: 'Water once a week, indirect sunlight',
    image: '',
    estimatedBirthDate: '2022-02-14',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plant-stub-2',
    ownerId: 'stub-owner',
    name: 'Pothos',
    specialNeeds: '',
    image: '',
    estimatedBirthDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

router.get('/', requireAuth, (_req, res) => {
  res.json(STUB_PLANTS);
});

router.post('/', requireAuth, (req, res) => {
  const plant = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  res.status(201).json(plant);
});

router.put('/:id', requireAuth, (req, res) => {
  res.json({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
});

router.delete('/:id', requireAuth, (_req, res) => {
  res.status(204).send();
});

export { router as plantsRouter };
