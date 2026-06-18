import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { HomeDataService, PetCreate, PetUpdate } from '../../home-data.service';
import type { Pet, AnimalSize } from '@livin/common';
import { formatAnimalType, formatSize, formatDate } from '../../../../shared/utils/format';

interface PetDraft {
  id: string | null;
  name: string;
  type: string;
  size: string;
  specialNeeds: string;
  image: string;
  estimatedBirthDate: string;
}

const PET_TYPES = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles'] as const;
const ANIMAL_SIZES = ['small', 'medium', 'large'] as const;

@Component({
  selector: 'app-pets-tab',
  imports: [FormsModule],
  templateUrl: './pets-tab.html',
})
export class PetsTab {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly data = inject(HomeDataService);

  protected readonly pets = this.data.pets;
  protected readonly editMode = signal(false);
  protected readonly formOpen = signal(false);

  protected readonly petTypes = PET_TYPES;
  protected readonly animalSizes = ANIMAL_SIZES;
  protected draft: PetDraft = this.emptyDraft();

  protected readonly formatAnimalType = formatAnimalType;
  protected readonly formatSize = formatSize;
  protected readonly formatDate = formatDate;

  protected toggleEditMode(): void {
    this.editMode.update(v => !v);
  }

  protected openAdd(): void {
    this.draft = this.emptyDraft();
    this.formOpen.set(true);
  }

  protected openEdit(pet: Pet): void {
    this.draft = {
      id: pet.id,
      name: pet.name,
      type: String(pet.type),
      size: pet.size,
      specialNeeds: pet.specialNeeds,
      image: pet.image,
      estimatedBirthDate: pet.estimatedBirthDate ?? '',
    };
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(): void {
    const d = this.draft;
    if (!d.name.trim()) return;
    const now = new Date().toISOString();
    if (d.id) {
      this.data.editPet({ id: d.id, ownerId: this.auth.user()?.id ?? '', name: d.name.trim(), type: d.type, size: d.size as AnimalSize, specialNeeds: d.specialNeeds.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null } as PetUpdate);
    } else {
      this.data.addPet({ ownerId: this.auth.user()?.id ?? '', name: d.name.trim(), type: d.type, size: d.size as AnimalSize, specialNeeds: d.specialNeeds.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null } as PetCreate);
    }
    this.closeForm();
  }

  protected delete(id: string): void {
    this.data.deletePet(id);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.draft.image = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected clearImage(event: MouseEvent): void {
    event.stopPropagation();
    this.draft.image = '';
  }

  private emptyDraft(): PetDraft {
    return { id: null, name: '', type: 'dogs', size: 'medium', specialNeeds: '', image: '', estimatedBirthDate: '' };
  }
}
