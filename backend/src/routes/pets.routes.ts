import { Router } from 'express';
import { isPetPlantOwnerOrStrayReporter } from '../middleware/auth.js';
import { Pet } from '@livin/common'

const router = Router();

const STUB_PETS = [
  {
    id: 'pet-stub-1',
    ownerId: 'stub-owner',
    name: 'Max',
    type: 'dogs',
    size: 'large',
    specialNeeds: 'Needs a 30-minute walk every morning',
    image: '',
    estimatedBirthDate: '2020-04-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pet-stub-2',
    ownerId: 'stub-owner',
    name: 'Luna',
    type: 'cats',
    size: 'small',
    specialNeeds: '',
    image: '',
    estimatedBirthDate: '2021-08-22',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

router.get('/', (_req, res) => {
  res.json(STUB_PETS);
});

router.post('/', (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const pet: Pet = { id: crypto.randomUUID(), ...req.body, ownerId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  res.status(201).json(pet);
});

router.put('/:id', isPetPlantOwnerOrStrayReporter, (req, res) => {
  res.json({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
});

router.delete('/:id', isPetPlantOwnerOrStrayReporter, (_req, res) => {
  res.status(204).send();
});

export { router as petsRouter };
