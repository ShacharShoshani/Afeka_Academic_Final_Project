import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import type { Pet, Plant, StrayAnimal } from '@livin/common';
import { environment } from 'src/environments/environment.local';

// The optional onboarding/care-detail fields. Forms that don't edit them may omit
// them — the server keeps existing values on PUT and applies defaults on POST.
type OptionalPetFields = 'friendliness' | 'allergies' | 'description' | 'careDetails';
type OptionalPlantFields = 'description' | 'careDetails';

export type PetCreate = Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | OptionalPetFields> &
  Partial<Pick<Pet, OptionalPetFields>>;
export type PetUpdate = PetCreate & { id: string };
export type PlantCreate = Omit<Plant, 'id' | 'createdAt' | 'updatedAt' | OptionalPlantFields> &
  Partial<Pick<Plant, OptionalPlantFields>>;
export type PlantUpdate = PlantCreate & { id: string };

@Injectable()
export class HomeDataService {
  readonly pets = signal<Pet[]>([]);
  readonly plants = signal<Plant[]>([]);
  readonly strayAnimals = signal<StrayAnimal[]>([]);

  private http = inject(HttpClient);
  private petsUrl = `${environment.apiUrl}/pets`;
  private plantsUrl = `${environment.apiUrl}/plants`;
  private strayAnimalsUrl = `${environment.apiUrl}/stray-animals`;

  loadPets() {
    this.loadList(this.petsUrl, this.pets);
  }

  loadPlants() {
    this.loadList(this.plantsUrl, this.plants);
  }

  loadStrayAnimals() {
    this.loadList(this.strayAnimalsUrl, this.strayAnimals);
  }

  addPet(pet: PetCreate) {
    this.addToList(this.petsUrl, pet, this.pets);
  }

  addPlant(plant: PlantCreate) {
    this.addToList(this.plantsUrl, plant, this.plants);
  }

  addStrayAnimal(strayAnimal: Omit<StrayAnimal, 'id' | 'createdAt' | 'updatedAt'>) {
    this.addToList(this.strayAnimalsUrl, strayAnimal, this.strayAnimals);
  }

  editPet(pet: PetUpdate) {
    this.editItem(this.petsUrl, pet, this.pets);
  }

  editPlant(plant: PlantUpdate) {
    this.editItem(this.plantsUrl, plant, this.plants);
  }

  editStrayAnimal(strayAnimal: Omit<StrayAnimal, 'createdAt' | 'updatedAt'>) {
    this.editItem(this.strayAnimalsUrl, strayAnimal, this.strayAnimals);
  }

  deletePet(id: string) {
    this.deleteItem(this.petsUrl, id, this.pets);
  }

  deletePlant(id: string) {
    this.deleteItem(this.plantsUrl, id, this.plants);
  }

  deleteStrayAnimal(id: string) {
    this.deleteItem(this.strayAnimalsUrl, id, this.strayAnimals);
  }

  private loadList<T>(url: string, signal: WritableSignal<T[]>) {
    this.http.get<T[]>(url, { withCredentials: true }).subscribe({
      next: (data) => {
        signal.set(data);
      },
      error: (error) => this.handleError(error),
    });
  }

  private addToList<T>(url: string, item: object, signal: WritableSignal<T[]>) {
    this.http.post<T>(url, item, { withCredentials: true }).subscribe({
      next: (newItem) => {
        signal.update((list) => [...list, newItem]);
      },
      error: (error) => this.handleError(error),
    });
  }

  private editItem<T>(url: string, item: { id: string }, signal: WritableSignal<T[]>) {
    this.http.put<T>(`${url}/${(item as any).id}`, item, { withCredentials: true }).subscribe({
      next: (updatedItem) => {
        signal.update((list) => list.map((i) => ((i as any).id === (item as any).id ? updatedItem : i)));
      },
      error: (error) => this.handleError(error),
    });
  }

  private deleteItem<T>(url: string, id: string, signal: WritableSignal<T[]>) {
    this.http.delete(`${url}/${id}`, { withCredentials: true }).subscribe({
      next: () => signal.update((list) => list.filter((i) => (i as any).id !== id)),
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: any) {
    console.error('API error:', error);
    alert(error?.message || 'An error occurred while communicating with the server. Please try again later.');
  }
}
