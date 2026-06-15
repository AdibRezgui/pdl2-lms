import {
  Component, Input, OnInit, OnChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-text',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="at-root" [attr.data-key]="animKey">

      <!-- Title row -->
      <div class="at-title-row">

        <!-- Prefix letters -->
        <span *ngFor="let l of prefixLetters; let i = index"
              class="at-letter"
              [style.animation-delay.ms]="i * letterDelay">{{ l === ' ' ? ' ' : l }}</span>

        <!-- Highlighted name with animated underline -->
        <span class="at-hl-wrap" *ngIf="nameLetters.length > 0">
          <span *ngFor="let l of nameLetters; let i = index"
                class="at-letter at-hl"
                [style.animation-delay.ms]="(prefixLetters.length + i) * letterDelay">{{ l === ' ' ? ' ' : l }}</span>
          <span class="at-underline" [style.animation-delay.ms]="underlineDelay"></span>
        </span>

        <!-- Suffix letters -->
        <span *ngFor="let l of suffixLetters; let i = index"
              class="at-letter"
              [style.animation-delay.ms]="(prefixLetters.length + nameLetters.length + i) * letterDelay">{{ l === ' ' ? ' ' : l }}</span>
      </div>

      <!-- Subtitle -->
      <p *ngIf="subtitle" class="at-sub"
         [style.animation-delay.ms]="totalLetters * letterDelay + 200">{{ subtitle }}</p>
    </div>
  `,
  styles: [`
    .at-root { display: flex; flex-direction: column; gap: 4px; }

    /* ── Title row ─────────────────────────────── */
    .at-title-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      font-family: 'Fraunces', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #1a2d3a;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    /* ── Letter entrance animation ──────────────── */
    .at-letter {
      display: inline-block;
      opacity: 0;
      transform: translateY(18px);
      animation: at-rise 480ms cubic-bezier(0.17, 0.55, 0.55, 1) forwards;
    }

    @keyframes at-rise {
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Highlighted segment ────────────────────── */
    .at-hl-wrap {
      position: relative;
      display: inline-flex;
      align-items: baseline;
    }
    .at-hl {
      background: linear-gradient(135deg, #00B4C6, #007A8A);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Gradient underline ─────────────────────── */
    .at-underline {
      position: absolute;
      bottom: -3px;
      left: 0; right: 0;
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, #00B4C6, #00A8BC, #007A8A);
      transform: scaleX(0);
      transform-origin: left;
      animation: at-line 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes at-line {
      to { transform: scaleX(1); }
    }

    /* ── Subtitle ────────────────────────────────── */
    .at-sub {
      font-size: 13px;
      color: #5a7a8a;
      margin: 0;
      opacity: 0;
      animation: at-fade 400ms ease forwards;
    }
    @keyframes at-fade {
      to { opacity: 1; }
    }
  `],
})
export class AnimatedTextComponent implements OnInit, OnChanges {
  @Input() prefix = '';
  @Input() name   = '';
  @Input() suffix = '';
  @Input() subtitle = '';
  @Input() letterDelay = 38; // ms stagger between letters

  prefixLetters: string[] = [];
  nameLetters:   string[] = [];
  suffixLetters: string[] = [];
  underlineDelay = 0;
  totalLetters   = 0;
  animKey        = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit()    { this.build(); }
  ngOnChanges() { this.build(); }

  private build() {
    this.prefixLetters = Array.from(this.prefix);
    this.nameLetters   = Array.from(this.name);
    this.suffixLetters = Array.from(this.suffix);
    this.totalLetters  = this.prefixLetters.length + this.nameLetters.length + this.suffixLetters.length;
    this.underlineDelay = (this.prefixLetters.length + this.nameLetters.length) * this.letterDelay + 80;
    this.animKey++;
    this.cdr.markForCheck();
  }
}
