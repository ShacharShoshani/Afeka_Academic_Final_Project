import { Router } from 'express';
import { ownershipGuard } from '../middleware/auth.js';

const strayReporter = ownershipGuard('strayAnimal');

const router = Router();

const STUB_STRAY_ANIMALS = [
  {
    id: 'stray-stub-1',
    reporterId: 'stub-owner',
    name: 'Buddy',
    type: 'dogs',
    size: 'medium',
    location: 'Central Park, near the east entrance',
    description: 'Brown and white, wearing a faded collar with no tag',
    image: '',
    estimatedBirthDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stray-stub-2',
    reporterId: 'stub-owner',
    name: null,
    type: 'cats',
    size: 'small',
    location: '5th Ave & 42nd St',
    description: '',
    image: '',
    estimatedBirthDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

router.get('/', (_req, res) => {
  res.json(STUB_STRAY_ANIMALS);
});

router.post('/', (req, res) => {
  const reporterId = req.user?.id;

  if (!reporterId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const stray = { id: crypto.randomUUID(), ...req.body, reporterId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  res.status(201).json(stray);
});

router.put('/:id', strayReporter, (req, res) => {
  res.json({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
});

router.delete('/:id', strayReporter, (_req, res) => {
  res.status(204).send();
});

export { router as strayAnimalsRouter };
