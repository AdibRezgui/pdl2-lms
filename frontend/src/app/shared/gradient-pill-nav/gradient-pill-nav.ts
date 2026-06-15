import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface PillNavItem {
  label: string;
  path: string;
  gradientFrom: string;
  gradientTo: string;
  svg?: string;      // inline SVG HTML string
  iconSrc?: string;  // path to image/svg asset
}

@Component({
  selector: 'app-gradient-pill-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ul class="pill-nav" [style.--cols]="columns">
      <li *ngFor="let item of items"
          [routerLink]="item.path"
          class="pill-item"
          [class.portrait]="columns >= 3"
          [style.--gf]="item.gradientFrom"
          [style.--gt]="item.gradientTo">

        <!-- Gradient background (fades in on hover) -->
        <span class="pill-bg"></span>

        <!-- Glow layer below -->
        <span class="pill-glow"></span>

        <!-- Icon -->
        <span class="pill-icon-wrap">
          <img *ngIf="item.iconSrc"
               [src]="item.iconSrc"
               class="pill-img" alt="" />
          <span *ngIf="!item.iconSrc && item.svg"
                class="pill-icon-inline"
                [innerHTML]="item.svg"></span>
        </span>

        <!-- Label -->
        <span class="pill-label">{{ item.label }}</span>
      </li>
    </ul>
  `,
  styles: [`
    /* ── Grid container ────────────────────────────── */
    .pill-nav {
      display: grid;
      grid-template-columns: repeat(var(--cols, 2), 1fr);
      gap: 10px;
      list-style: none;
      padding: 0; margin: 0;
    }

    /* ── Pill card — landscape (2 col) ─────────────── */
    .pill-item {
      position: relative;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 10px;
      padding: 0 14px;
      cursor: pointer;
      background: #fff;
      border: 1.5px solid rgba(0, 180, 198, 0.14);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      list-style: none;
      text-decoration: none;
      transition:
        border-color 0.35s cubic-bezier(0.23, 1, 0.32, 1),
        box-shadow   0.35s cubic-bezier(0.23, 1, 0.32, 1),
        transform    0.35s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .pill-item:hover {
      border-color: transparent;
      transform: translateY(-2px);
    }

    /* ── Portrait variant (3+ col) ──────────────────── */
    .pill-item.portrait {
      flex-direction: column;
      justify-content: center;
      height: 82px;
      gap: 7px;
      padding: 12px 6px 10px;
    }

    /* ── Gradient background ─────────────────────────── */
    .pill-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, var(--gf), var(--gt));
      opacity: 0;
      transition: opacity 0.35s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .pill-item:hover .pill-bg { opacity: 1; }

    /* ── Glow below card ─────────────────────────────── */
    .pill-glow {
      position: absolute;
      inset: 8px 10px -14px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--gf), var(--gt));
      filter: blur(14px);
      opacity: 0;
      z-index: -1;
      transition: opacity 0.35s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .pill-item:hover .pill-glow { opacity: 0.55; }

    /* ── Icon wrapper ────────────────────────────────── */
    .pill-icon-wrap {
      position: relative; z-index: 1;
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    /* Slightly larger icon in portrait mode */
    .pill-item.portrait .pill-icon-wrap {
      width: 28px; height: 28px;
    }
    .pill-item.portrait .pill-img {
      width: 24px; height: 24px;
    }

    /* Image-based icon (SVG file via <img>) */
    .pill-img {
      width: 22px; height: 22px;
      object-fit: contain;
      filter: opacity(0.55);
      transition: filter 0.35s;
    }
    .pill-item:hover .pill-img {
      filter: brightness(0) invert(1) opacity(1);
    }

    /* Inline SVG icon */
    .pill-icon-inline {
      display: flex; align-items: center; justify-content: center;
      color: #5a7a8a;
      transition: color 0.35s;
    }
    .pill-item:hover .pill-icon-inline { color: #fff; }

    /* ── Label ──────────────────────────────────────── */
    .pill-label {
      position: relative; z-index: 1;
      font-size: 12.5px; font-weight: 700;
      color: #1a2d3a;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.35s;
    }
    /* Portrait: centered, wrap allowed, smaller text */
    .pill-item.portrait .pill-label {
      font-size: 11px;
      white-space: normal;
      text-align: center;
      line-height: 1.25;
      overflow: visible;
      text-overflow: unset;
    }
    .pill-item:hover .pill-label { color: #fff; }
  `],
})
export class GradientPillNav {
  @Input() items: PillNavItem[] = [];
  @Input() columns: number = 2;
}
