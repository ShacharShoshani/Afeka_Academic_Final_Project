import { Component, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import type { Pet, Plant, StrayAnimal, AnimalSize } from '@livin/common';

type Tab = 'profile' | 'pets' | 'plants' | 'stray';
type FormKind = 'none' | 'pet' | 'plant' | 'stray';

interface PetDraft {
  id: string | null;
  name: string;
  type: string;
  size: string;
  specialNeeds: string;
  image: string;
  estimatedBirthDate: string;
}

interface PlantDraft {
  id: string | null;
  name: string;
  specialNeeds: string;
  image: string;
  estimatedBirthDate: string;
}

interface StrayDraft {
  id: string | null;
  name: string;
  type: string;
  size: string;
  location: string;
  description: string;
  image: string;
  estimatedBirthDate: string;
}

const PET_TYPES = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles'] as const;
const STRAY_TYPES = ['dogs', 'cats', 'birds', 'rabbits', 'reptiles'] as const;
const ANIMAL_SIZES = ['small', 'medium', 'large'] as const;

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;
  protected readonly isOwner = computed(() => this.user()?.role === 'owner');
  protected readonly activeTab = signal<Tab>('profile');
  protected readonly editMode = signal(false);
  protected readonly formKind = signal<FormKind>('none');

  protected readonly pets = signal<Pet[]>([]);
  protected readonly plants = signal<Plant[]>([]);
  protected readonly strayAnimals = signal<StrayAnimal[]>([]);

  protected readonly petTypes = PET_TYPES;
  protected readonly strayTypes = STRAY_TYPES;
  protected readonly animalSizes = ANIMAL_SIZES;

  protected petDraft: PetDraft = this.emptyPetDraft();
  protected plantDraft: PlantDraft = this.emptyPlantDraft();
  protected strayDraft: StrayDraft = this.emptyStrayDraft();

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.editMode.set(false);
    this.formKind.set('none');
  }

  protected toggleEditMode(): void {
    this.editMode.update(v => !v);
    this.formKind.set('none');
  }

  protected openAddForm(kind: 'pet' | 'plant' | 'stray'): void {
    if (kind === 'pet') this.petDraft = this.emptyPetDraft();
    else if (kind === 'plant') this.plantDraft = this.emptyPlantDraft();
    else this.strayDraft = this.emptyStrayDraft();
    this.formKind.set(kind);
  }

  protected openEditPet(pet: Pet): void {
    this.petDraft = {
      id: pet.id,
      name: pet.name,
      type: String(pet.type),
      size: pet.size,
      specialNeeds: pet.specialNeeds,
      image: pet.image,
      estimatedBirthDate: pet.estimatedBirthDate ?? '',
    };
    this.formKind.set('pet');
  }

  protected openEditPlant(plant: Plant): void {
    this.plantDraft = {
      id: plant.id,
      name: plant.name,
      specialNeeds: plant.specialNeeds,
      image: plant.image,
      estimatedBirthDate: plant.estimatedBirthDate ?? '',
    };
    this.formKind.set('plant');
  }

  protected openEditStray(stray: StrayAnimal): void {
    this.strayDraft = {
      id: stray.id,
      name: stray.name ?? '',
      type: String(stray.type),
      size: stray.size,
      location: stray.location,
      description: stray.description,
      image: stray.image,
      estimatedBirthDate: stray.estimatedBirthDate ?? '',
    };
    this.formKind.set('stray');
  }

  protected closeForm(): void {
    this.formKind.set('none');
  }

  protected savePet(): void {
    const d = this.petDraft;
    if (!d.name.trim()) return;
    const now = new Date().toISOString();
    if (d.id) {
      this.pets.update(list =>
        list.map(p =>
          p.id === d.id
            ? ({ ...p, name: d.name.trim(), type: d.type, size: d.size as AnimalSize, specialNeeds: d.specialNeeds.trim(), image: d.image.trim(), estimatedBirthDate: d.estimatedBirthDate || null, updatedAt: now } as Pet)
            : p
        )
      );
    } else {
      this.pets.update(list => [
        ...list,
        {
          id: crypto.randomUUID(),
          ownerId: this.user()?.id ?? '',
          name: d.name.trim(),
          type: d.type,
          size: d.size as AnimalSize,
          specialNeeds: d.specialNeeds.trim(),
          image: d.image.trim(),
          estimatedBirthDate: d.estimatedBirthDate || null,
          createdAt: now,
          updatedAt: now,
        } as Pet,
      ]);
    }
    this.closeForm();
  }

  protected savePlant(): void {
    const d = this.plantDraft;
    if (!d.name.trim()) return;
    const now = new Date().toISOString();
    if (d.id) {
      this.plants.update(list =>
        list.map(p =>
          p.id === d.id
            ? { ...p, name: d.name.trim(), specialNeeds: d.specialNeeds.trim(), image: d.image.trim(), estimatedBirthDate: d.estimatedBirthDate || null, updatedAt: now }
            : p
        )
      );
    } else {
      this.plants.update(list => [
        ...list,
        {
          id: crypto.randomUUID(),
          ownerId: this.user()?.id ?? '',
          name: d.name.trim(),
          specialNeeds: d.specialNeeds.trim(),
          image: d.image.trim(),
          estimatedBirthDate: d.estimatedBirthDate || null,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    this.closeForm();
  }

  protected saveStray(): void {
    const d = this.strayDraft;
    if (!d.location.trim()) return;
    const now = new Date().toISOString();
    if (d.id) {
      this.strayAnimals.update(list =>
        list.map(s =>
          s.id === d.id
            ? ({ ...s, name: d.name.trim() || null, type: d.type, size: d.size as AnimalSize, location: d.location.trim(), description: d.description.trim(), image: d.image.trim(), estimatedBirthDate: d.estimatedBirthDate || null, updatedAt: now } as StrayAnimal)
            : s
        )
      );
    } else {
      this.strayAnimals.update(list => [
        ...list,
        {
          id: crypto.randomUUID(),
          reporterId: this.user()?.id ?? '',
          name: d.name.trim() || null,
          type: d.type,
          size: d.size as AnimalSize,
          location: d.location.trim(),
          description: d.description.trim(),
          image: d.image.trim(),
          estimatedBirthDate: d.estimatedBirthDate || null,
          createdAt: now,
          updatedAt: now,
        } as StrayAnimal,
      ]);
    }
    this.closeForm();
  }

  protected deletePet(id: string): void {
    this.pets.update(list => list.filter(p => p.id !== id));
  }

  protected deletePlant(id: string): void {
    this.plants.update(list => list.filter(p => p.id !== id));
  }

  protected deleteStray(id: string): void {
    this.strayAnimals.update(list => list.filter(s => s.id !== id));
  }

  protected getRoleLabel(role: string | undefined): string {
    if (role === 'owner') return 'Pet Owner';
    if (role === 'caretaker') return 'Caretaker';
    if (role === 'admin') return 'Admin';
    return '';
  }

  protected formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  protected formatJoinDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  protected formatLastUpdated(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  protected formatCareType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }

  protected formatAvailability(slot: string): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  protected formatAnimalType(type: unknown): string {
    const t = String(type);
    return t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ');
  }

  protected formatSize(size: string): string {
    return size.charAt(0).toUpperCase() + size.slice(1);
  }

  protected onFileSelected(event: Event, draft: { image: string }): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      draft.image = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected clearImage(draft: { image: string }, event: MouseEvent): void {
    event.stopPropagation();
    draft.image = '';
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  private emptyPetDraft(): PetDraft {
    return { id: null, name: '', type: 'dogs', size: 'medium', specialNeeds: '', image: '', estimatedBirthDate: '' };
  }

  private emptyPlantDraft(): PlantDraft {
    return { id: null, name: '', specialNeeds: '', image: '', estimatedBirthDate: '' };
  }

  private emptyStrayDraft(): StrayDraft {
    return { id: null, name: '', type: 'dogs', size: 'medium', location: '', description: '', image: '', estimatedBirthDate: '' };
  }
}
