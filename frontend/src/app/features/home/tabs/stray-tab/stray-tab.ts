import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { HomeDataService } from '../../home-data.service';
import type { StrayAnimal, AnimalSize } from '@livin/common';
import { formatAnimalType, formatSize, formatDate } from '../../../../shared/utils/format';

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

const STRAY_TYPES = ['dogs', 'cats', 'birds', 'rabbits', 'reptiles'] as const;
const ANIMAL_SIZES = ['small', 'medium', 'large'] as const;

@Component({
  selector: 'app-stray-tab',
  imports: [FormsModule],
  templateUrl: './stray-tab.html',
})
export class StrayTab {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly data = inject(HomeDataService);

  protected readonly strays = this.data.strayAnimals;
  protected readonly editMode = signal(false);
  protected readonly formOpen = signal(false);

  protected readonly strayTypes = STRAY_TYPES;
  protected readonly animalSizes = ANIMAL_SIZES;
  protected draft: StrayDraft = this.emptyDraft();

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

  protected openEdit(stray: StrayAnimal): void {
    this.draft = {
      id: stray.id,
      name: stray.name ?? '',
      type: String(stray.type),
      size: stray.size,
      location: stray.location,
      description: stray.description,
      image: stray.image,
      estimatedBirthDate: stray.estimatedBirthDate ?? '',
    };
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(): void {
    const d = this.draft;
    if (!d.location.trim()) return;
    const now = new Date().toISOString();
    if (d.id) {
      this.data.strayAnimals.update(list =>
        list.map(s =>
          s.id === d.id
            ? ({ ...s, name: d.name.trim() || null, type: d.type, size: d.size as AnimalSize, location: d.location.trim(), description: d.description.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null, updatedAt: now } as StrayAnimal)
            : s
        )
      );
    } else {
      this.data.strayAnimals.update(list => [
        ...list,
        { id: crypto.randomUUID(), reporterId: this.auth.user()?.id ?? '', name: d.name.trim() || null, type: d.type, size: d.size as AnimalSize, location: d.location.trim(), description: d.description.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null, createdAt: now, updatedAt: now } as StrayAnimal,
      ]);
    }
    this.closeForm();
  }

  protected delete(id: string): void {
    this.data.strayAnimals.update(list => list.filter(s => s.id !== id));
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

  private emptyDraft(): StrayDraft {
    return { id: null, name: '', type: 'dogs', size: 'medium', location: '', description: '', image: '', estimatedBirthDate: '' };
  }
}
