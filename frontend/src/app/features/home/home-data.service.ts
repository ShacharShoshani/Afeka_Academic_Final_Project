import { Injectable, signal } from '@angular/core';
import type { Pet, Plant, StrayAnimal } from '@livin/common';

@Injectable()
export class HomeDataService {
  readonly pets = signal<Pet[]>([]);
  readonly plants = signal<Plant[]>([]);
  readonly strayAnimals = signal<StrayAnimal[]>([]);
}
