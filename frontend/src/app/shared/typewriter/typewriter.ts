import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typewriter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="className">{{ displayText }}<span class="tw-cursor">{{ cursor }}</span></span>
  `,
  styles: [`
    .tw-cursor {
      display: inline-block;
      animation: tw-blink 1s step-start infinite;
      margin-left: 1px;
    }
    @keyframes tw-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0; }
    }
  `],
})
export class TypewriterComponent implements OnInit, OnDestroy {
  @Input() text: string | string[] = '';
  @Input() speed      = 90;
  @Input() deleteSpeed = 45;
  @Input() delay      = 1600;
  @Input() cursor     = '|';
  @Input() loop       = true;
  @Input() className  = '';

  displayText = '';

  private idx    = 0;   // char position within currentText
  private arrIdx = 0;   // which phrase we're on
  private deleting = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  private get phrases(): string[] {
    return Array.isArray(this.text) ? this.text : [this.text];
  }
  private get current(): string {
    return this.phrases[this.arrIdx] ?? '';
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.schedule(); }
  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }

  private schedule() {
    this.timer = setTimeout(() => this.tick(), this.deleting ? this.deleteSpeed : this.speed);
  }

  private tick() {
    if (!this.current) return;

    if (!this.deleting) {
      if (this.idx < this.current.length) {
        this.displayText += this.current[this.idx++];
        this.cdr.markForCheck();
        this.schedule();
      } else if (this.loop) {
        // pause then start deleting
        this.timer = setTimeout(() => {
          this.deleting = true;
          this.schedule();
        }, this.delay);
      }
    } else {
      if (this.displayText.length > 0) {
        this.displayText = this.displayText.slice(0, -1);
        this.cdr.markForCheck();
        this.schedule();
      } else {
        this.deleting = false;
        this.idx = 0;
        this.arrIdx = (this.arrIdx + 1) % this.phrases.length;
        this.cdr.markForCheck();
        this.schedule();
      }
    }
  }
}
