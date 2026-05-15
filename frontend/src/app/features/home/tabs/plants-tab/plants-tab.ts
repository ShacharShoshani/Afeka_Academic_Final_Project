import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { HomeDataService } from '../../home-data.service';
import type { Plant } from '@livin/common';
import { formatDate } from '../../../../shared/utils/format';

interface PlantDraft {
  id: string | null;
  name: string;
  specialNeeds: string;
  image: string;
  estimatedBirthDate: string;
}

@Component({
  selector: 'app-plants-tab',
  imports: [FormsModule],
  templateUrl: './plants-tab.html',
})
export class PlantsTab {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly data = inject(HomeDataService);

  protected readonly plants = this.data.plants;
  protected readonly editMode = signal(false);
  protected readonly formOpen = signal(false);

  protected draft: PlantDraft = this.emptyDraft();

  protected readonly formatDate = formatDate;

  protected toggleEditMode(): void {
    this.editMode.update(v => !v);
  }

  protected openAdd(): void {
    this.draft = this.emptyDraft();
    this.formOpen.set(true);
  }

  protected openEdit(plant: Plant): void {
    this.draft = {
      id: plant.id,
      name: plant.name,
      specialNeeds: plant.specialNeeds,
      image: plant.image,
      estimatedBirthDate: plant.estimatedBirthDate ?? '',
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
      this.data.editPlant({ id: d.id, ownerId: this.auth.user()?.id ?? '', name: d.name.trim(), specialNeeds: d.specialNeeds.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null } as Omit<Plant, 'createdAt' | 'updatedAt'>);
    } else {
      this.data.addPlant({ ownerId: this.auth.user()?.id ?? '', name: d.name.trim(), specialNeeds: d.specialNeeds.trim(), image: d.image, estimatedBirthDate: d.estimatedBirthDate || null } as Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>);
    }
    this.closeForm();
  }

  protected delete(id: string): void {
    this.data.deletePlant(id);
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

  private emptyDraft(): PlantDraft {
    return { id: null, name: '', specialNeeds: '', image: '', estimatedBirthDate: '' };
  }
}
