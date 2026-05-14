import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import type { Pet, Plant, StrayAnimal } from '@livin/common';
import { environment } from 'src/environments/environment.local';

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

  addPet(pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) {
    this.addToList(this.petsUrl, pet, this.pets);
  }

  addPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) {
    this.addToList(this.plantsUrl, plant, this.plants);
  }

  addStrayAnimal(strayAnimal: Omit<StrayAnimal, 'id' | 'createdAt' | 'updatedAt'>) {
    this.addToList(this.strayAnimalsUrl, strayAnimal, this.strayAnimals);
  }

  editPet(pet: Omit<Pet, 'createdAt' | 'updatedAt'>) {
    this.editItem(this.petsUrl, pet, this.pets);
  }

  editPlant(plant: Omit<Plant, 'createdAt' | 'updatedAt'>) {
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
    this.http.get<T[]>(url, { withCredentials: true }).subscribe((data) => {
      signal.set(data);
    });
  }

  private addToList<T>(url: string, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, signal: WritableSignal<T[]>) {
    this.http.post<T>(url, item, { withCredentials: true }).subscribe((newItem) => {
      signal.update((list) => [...list, newItem]);
    });
  }

  private editItem<T>(url: string, item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, signal: WritableSignal<T[]>) {
    this.http.put<T>(`${url}/${(item as any).id}`, item, { withCredentials: true }).subscribe((updatedItem) => {
      signal.update((list) => list.map((i) => ((i as any).id === (item as any).id ? updatedItem : i)));
    });
  }

  private deleteItem<T>(url: string, id: string, signal: WritableSignal<T[]>) {
    this.http.delete(`${url}/${id}`, { withCredentials: true }).subscribe(() => {
      signal.update((list) => list.filter((i) => (i as any).id !== id));
    });
  }
}
