import { Component, input, output } from '@angular/core';
import { CareType } from '@livin/common';

/**
 * Reusable care-type selector chips (dogs/cats/.../stray animals) with icons.
 * Stateless: the parent owns the selected array and reacts to (toggle).
 */
@Component({
  selector: 'app-care-type-chips',
  styleUrl: './care-type-chips.css',
  templateUrl: './care-type-chips.html',
})
export class CareTypeChips {
  readonly selected = input<CareType[]>([]);
  readonly ariaLabel = input<string>('Care types');
  readonly toggle = output<CareType>();

  protected isOn(type: CareType): boolean {
    return this.selected().includes(type);
  }
}
