import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  currentStep = input.required<number>();
  totalSteps = input.required<number>();

  protected percentage = computed(
    () => (this.currentStep() / this.totalSteps()) * 100,
  );
}
