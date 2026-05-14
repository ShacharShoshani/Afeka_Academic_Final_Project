import { Router } from 'express';
import { isPetPlantOwnerOrStrayReporter } from '../middleware/auth.js';
import { Plant } from '@livin/common';

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

router.get('/', (_req, res) => {
  res.json(STUB_PLANTS);
});

router.post('/', (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const plant: Plant = { id: crypto.randomUUID(), ...req.body, ownerId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  res.status(201).json(plant);
});

router.put('/:id', isPetPlantOwnerOrStrayReporter, (req, res) => {
  res.json({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
});

router.delete('/:id', isPetPlantOwnerOrStrayReporter, (_req, res) => {
  res.status(204).send();
});

export { router as plantsRouter };
