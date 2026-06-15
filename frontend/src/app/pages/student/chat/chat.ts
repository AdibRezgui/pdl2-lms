import {
  Component, OnInit, AfterViewChecked, OnDestroy,
  signal, ViewChild, ElementRef, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Msg { role: 'user' | 'assistant'; content: string; }

const ACTIONS = [
  {
    label: 'Ma progression',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  },
  {
    label: 'Résumer un cours',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  },
  {
    label: 'Préparer un quiz',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
  {
    label: 'Recommandation',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    label: 'Mes objectifs',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  },
  {
    label: 'Exercice pratique',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  },
];

const CHIPS = ['Ma progression', 'Résumer un cours', 'Préparer un quiz', 'Prochains objectifs'];

const BARS = Array.from({ length: 32 }, (_, i) => ({
  h: Math.max(12, Math.round(Math.abs(Math.sin(i * 1.3 + 0.5)) * 68 + 12)),
  d: ((i * 0.048) % 1.55).toFixed(3),
  dur: (0.42 + (i % 7) * 0.09).toFixed(2),
}));

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cc-root">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <div class="cc-panel">
        <!-- ── Topbar ── -->
        <div class="cc-topbar">
          <div class="cc-topbar-l">
            <div class="cc-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <div class="cc-bot-name">EduBot <span class="cc-teal">IA</span></div>
              <div class="cc-status"><span class="cc-dot"></span>En ligne · Assistant pédagogique</div>
            </div>
          </div>
          <button class="cc-clear-btn" (click)="clearChat()">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Nouvelle conversation
          </button>
        </div>

        <!-- ── Messages ── -->
        <div class="cc-messages" #scrollRef>

          <!-- Welcome state -->
          <div *ngIf="messages().length === 0" class="cc-welcome">
            <div class="cc-orb">
              <div class="cc-orb-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>
            <h2 class="cc-welcome-title">Bonjour, je suis <span class="cc-teal">EduBot !</span></h2>
            <p class="cc-welcome-sub">
              Votre assistant pédagogique IA. Posez-moi vos questions sur vos cours,
              votre progression ou les évaluations.
            </p>
            <div class="cc-qa-grid">
              <button *ngFor="let a of actions" (click)="sendSuggestion(a.label)" class="cc-qa-btn">
                <span [innerHTML]="safe(a.icon)" class="cc-qa-icon"></span>
                {{ a.label }}
              </button>
            </div>
          </div>

          <!-- Message rows -->
          <div *ngFor="let m of messages()" class="cc-msg" [class.cc-msg-user]="m.role==='user'">
            <div *ngIf="m.role==='assistant'" class="cc-bot-av">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="cc-bubble"
                 [class.cc-bubble-user]="m.role==='user'"
                 [class.cc-bubble-bot]="m.role==='assistant'"
                 [innerHTML]="m.role==='assistant' ? toHtml(m.content) : m.content">
            </div>
          </div>

          <!-- Typing indicator -->
          <div *ngIf="typing()" class="cc-msg">
            <div class="cc-bot-av">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="cc-bubble cc-bubble-bot cc-typing">
              <span></span><span></span><span></span>
            </div>
          </div>

        </div>

        <!-- ── Prompt Input Box ── -->
        <div class="cc-input-bar">
          <div class="cc-pb-box"
               [class.cc-pb-loading]="typing()"
               [class.cc-pb-focused]="focused"
               [class.cc-pb-rec-on]="isRecording"
               (dragover)="$event.preventDefault()"
               (drop)="onDrop($event)">

            <!-- Image preview strip -->
            <div class="cc-pb-files" *ngIf="filePreview && !isRecording">
              <div class="cc-pb-thumb">
                <img [src]="filePreview" alt="aperçu image" />
                <button class="cc-pb-rm" (click)="removeFile()" aria-label="Supprimer l'image">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Textarea (collapsed when recording) -->
            <div class="cc-pb-ta-wrap" [class.cc-pb-ta-gone]="isRecording">
              <textarea #ta
                [(ngModel)]="draft"
                (input)="resize()"
                (focus)="focused=true" (blur)="focused=false"
                (keydown)="onKey($event)"
                [disabled]="typing() || isRecording"
                class="cc-pb-ta"
                [placeholder]="placeholder"
                rows="1">
              </textarea>
            </div>

            <!-- Voice visualizer (visible when recording) -->
            <div class="cc-pb-recorder" *ngIf="isRecording">
              <div class="cc-pb-rec-hd">
                <span class="cc-rec-dot"></span>
                <span class="cc-rec-time">{{ formatTime(recTime) }}</span>
              </div>
              <div class="cc-pb-bars">
                <div *ngFor="let b of bars" class="cc-bar"
                     [style.height]="b.h + '%'"
                     [style.animation-delay]="b.d + 's'"
                     [style.animation-duration]="b.dur + 's'">
                </div>
              </div>
            </div>

            <!-- Action row -->
            <div class="cc-pb-actions">

              <!-- Left: attach + mode toggles -->
              <div class="cc-pb-left" [class.cc-pb-left-gone]="isRecording">

                <button class="cc-pb-icon-btn" (click)="fileInp.click()" title="Joindre une image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <input #fileInp type="file" style="display:none" (change)="onFileChange($event)" accept="image/*" />

                <!-- Search -->
                <button class="cc-pb-toggle" [class.cc-pb-ts]="showSearch" (click)="toggleMode('search')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span class="cc-pb-lbl" [class.cc-pb-lbl-on]="showSearch">Chercher</span>
                </button>

                <div class="cc-pb-sep"></div>

                <!-- Think / Analyse -->
                <button class="cc-pb-toggle" [class.cc-pb-tt]="showThink" (click)="toggleMode('think')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                  </svg>
                  <span class="cc-pb-lbl" [class.cc-pb-lbl-on]="showThink">Analyser</span>
                </button>

                <div class="cc-pb-sep"></div>

                <!-- Resume / Canvas -->
                <button class="cc-pb-toggle" [class.cc-pb-tc]="showCanvas" (click)="toggleMode('canvas')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <polyline points="9 17 7 15 9 13"/>
                    <polyline points="13 13 15 15 13 17"/>
                  </svg>
                  <span class="cc-pb-lbl" [class.cc-pb-lbl-on]="showCanvas">Résumé</span>
                </button>

              </div>

              <!-- Right: send / mic / stop -->
              <button class="cc-pb-send"
                      [class.cc-pb-send-on]="sendState === 'active'"
                      [class.cc-pb-send-stop]="sendState === 'recording'"
                      (click)="onSendBtn()">
                <!-- Spinning loader -->
                <svg *ngIf="sendState === 'loading'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:cc-spin .8s linear infinite">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <!-- Stop circle when recording -->
                <svg *ngIf="sendState === 'recording'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none"/>
                </svg>
                <!-- Arrow up when has content -->
                <svg *ngIf="sendState === 'active'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
                <!-- Mic when empty -->
                <svg *ngIf="sendState === 'mic'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

            </div>
          </div>

          <!-- Suggestion chips -->
          <div class="cc-chips" *ngIf="messages().length === 0">
            <span class="cc-chips-lbl">Suggestions :</span>
            <button *ngFor="let s of chips" (click)="sendSuggestion(s)" class="cc-chip">{{ s }}</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ViewEncapsulation.None — all selectors global, prefixed cc- */

    .cc-root {
      display: flex !important;
      height: 100vh !important;
      overflow: hidden !important;
    }

    /* ── Panel — gradient mesh background ─────── */
    .cc-panel {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      position: relative !important;

      /* Layered radial gradients — mesh effect */
      background:
        /* Orange glow — bottom center */
        radial-gradient(ellipse 70% 45% at 50% 108%,
          rgba(255,107,0,.92) 0%,
          rgba(255,149,0,.68) 22%,
          transparent 52%
        ),
        /* Secondary warm halo */
        radial-gradient(ellipse 90% 55% at 50% 120%,
          rgba(255,149,0,.28) 0%,
          transparent 55%
        ),
        /* Pink-mauve blob — mid right */
        radial-gradient(ellipse 75% 60% at 72% 55%,
          rgba(217,180,212,.55) 0%,
          transparent 62%
        ),
        /* Lavender blob — top left */
        radial-gradient(ellipse 65% 50% at 18% 18%,
          rgba(188,196,232,.75) 0%,
          transparent 58%
        ),
        /* Base linear */
        linear-gradient(170deg,
          #bcc4e8 0%,
          #d9b4d4 42%,
          #f4d4c4 78%,
          #f0c6ae 100%
        ) !important;
    }

    /* ── Topbar ─────────────────────────────────── */
    .cc-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 26px;
      border-bottom: 1px solid rgba(188,196,232,.45);
      background: rgba(255,255,255,.55);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      flex-shrink: 0;
    }
    .cc-topbar-l { display:flex; align-items:center; gap:12px; }
    .cc-avatar {
      width:42px; height:42px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 22px rgba(0,180,198,.38);
    }
    .cc-bot-name {
      font-family:'Fraunces',Georgia,serif;
      font-size:17px; font-weight:700; color:#1a2035; line-height:1.2;
    }
    .cc-teal {
      background:linear-gradient(135deg,#00B4C6,#0099aa);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .cc-status {
      display:flex; align-items:center; gap:5px;
      font-size:11.5px; color:rgba(26,32,53,.48); margin-top:3px;
    }
    .cc-dot {
      width:7px; height:7px; border-radius:50%;
      background:#34d399; box-shadow:0 0 7px rgba(52,211,153,.7); flex-shrink:0;
    }
    .cc-clear-btn {
      display:flex; align-items:center; gap:6px;
      padding:7px 14px; border-radius:12px;
      background:rgba(255,255,255,.6); border:1px solid rgba(188,196,232,.5);
      color:rgba(26,32,53,.55); font-size:12px; font-weight:600;
      cursor:pointer; font-family:inherit; transition:all .2s;
      backdrop-filter: blur(8px);
    }
    .cc-clear-btn:hover {
      background:rgba(255,255,255,.85); color:#1a2035;
      border-color:rgba(0,180,198,.4);
      box-shadow: 0 4px 14px rgba(0,180,198,.15);
    }

    /* ── Messages ───────────────────────────────── */
    .cc-messages {
      flex:1; overflow-y:auto;
      padding:26px 26px 14px;
      display:flex; flex-direction:column; gap:14px;
      scrollbar-width:thin; scrollbar-color:rgba(0,180,198,.3) transparent;
    }
    .cc-messages::-webkit-scrollbar { width:4px; }
    .cc-messages::-webkit-scrollbar-thumb { background:rgba(0,180,198,.3); border-radius:2px; }

    /* ── Welcome ────────────────────────────────── */
    .cc-welcome {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      padding:32px 16px; gap:18px; text-align:center;
      animation:cc-wlc .5s cubic-bezier(.23,1,.32,1) both;
    }
    @keyframes cc-wlc {
      from { opacity:0; transform:translateY(20px) scale(.97); }
      to   { opacity:1; transform:none; }
    }
    .cc-orb {
      width:90px; height:90px; border-radius:50%;
      border:1.5px solid rgba(0,180,198,.35);
      display:flex; align-items:center; justify-content:center;
      animation:cc-orb-p 3s ease-in-out infinite;
      background: rgba(255,255,255,.22);
      backdrop-filter: blur(8px);
    }
    @keyframes cc-orb-p {
      0%,100% { box-shadow:0 0 28px rgba(0,180,198,.22), 0 0 60px rgba(188,196,232,.3); }
      50%      { box-shadow:0 0 52px rgba(0,180,198,.42), 0 0 90px rgba(188,196,232,.5); }
    }
    .cc-orb-icon {
      width:68px; height:68px; border-radius:50%;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 8px 30px rgba(0,180,198,.45);
    }
    .cc-welcome-title {
      font-family:'Fraunces',Georgia,serif;
      font-size:26px; font-weight:800; color:#1a2035; margin:0;
    }
    .cc-welcome-sub {
      font-size:14px; color:rgba(26,32,53,.52);
      line-height:1.65; margin:0; max-width:440px;
    }
    .cc-qa-grid {
      display:flex; flex-wrap:wrap; justify-content:center;
      gap:10px; max-width:520px; margin-top:6px;
    }
    .cc-qa-btn {
      display:flex; align-items:center; gap:8px;
      padding:10px 18px; border-radius:999px;
      background:rgba(255,255,255,.62); border:1px solid rgba(188,196,232,.5);
      color:rgba(26,32,53,.72); font-size:13px; font-weight:500;
      cursor:pointer; font-family:inherit;
      backdrop-filter:blur(10px);
      transition:all .25s cubic-bezier(.23,1,.32,1);
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
    }
    .cc-qa-btn:hover {
      background:rgba(255,255,255,.88); border-color:rgba(0,180,198,.45);
      color:#007A8A; transform:translateY(-2px);
      box-shadow:0 8px 22px rgba(0,180,198,.18);
    }
    .cc-qa-icon { display:flex; align-items:center; }

    /* ── Message rows ───────────────────────────── */
    .cc-msg {
      display:flex; align-items:flex-start; gap:10px;
      animation:cc-msg-in .28s cubic-bezier(.23,1,.32,1) both;
    }
    @keyframes cc-msg-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    .cc-msg-user { flex-direction:row-reverse; }
    .cc-bot-av {
      width:30px; height:30px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#00B4C6,#007A8A);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 12px rgba(0,180,198,.35); margin-top:2px;
    }
    .cc-bubble {
      max-width:72%; padding:11px 16px;
      font-size:13.5px; line-height:1.65;
      word-break:break-word; border-radius:18px;
    }
    .cc-bubble-user {
      background:linear-gradient(135deg,#00B4C6,#009eb5);
      color:#fff; border-radius:18px 18px 4px 18px;
      box-shadow:0 6px 20px rgba(0,180,198,.28);
    }
    /* Bot bubble — white glass on pastel bg */
    .cc-bubble-bot {
      background:rgba(255,255,255,.78);
      border:1px solid rgba(188,196,232,.4);
      backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px);
      color:#1a2d3a; border-radius:18px 18px 18px 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,.07);
    }
    .cc-bubble-bot strong { color:#1a2035; font-weight:700; }
    .cc-bubble-bot ul { margin:4px 0; padding-left:18px; }
    .cc-bubble-bot li { margin-bottom:3px; }

    /* Typing dots */
    .cc-typing { display:flex; align-items:center; gap:5px; padding:13px 18px; }
    .cc-typing span {
      display:block; width:7px; height:7px; border-radius:50%;
      background:rgba(0,180,198,.75);
      animation:cc-dot-p 1.4s ease-in-out infinite;
    }
    .cc-typing span:nth-child(2) { animation-delay:.2s; }
    .cc-typing span:nth-child(3) { animation-delay:.4s; }
    @keyframes cc-dot-p {
      0%,80%,100% { transform:scale(.65); opacity:.4; }
      40%          { transform:scale(1);   opacity:1;  }
    }

    /* ── Input bar wrapper ──────────────────────── */
    .cc-input-bar {
      padding: 12px 20px 18px;
      display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
    }

    /* ── PromptInputBox container ───────────────── */
    .cc-pb-box {
      background: rgba(22, 23, 28, 0.88);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(68, 68, 75, 0.7);
      border-radius: 24px;
      padding: 8px;
      transition: border-color .25s, box-shadow .25s;
      box-shadow: 0 8px 36px rgba(0,0,0,.24), 0 2px 8px rgba(0,0,0,.12);
    }
    .cc-pb-box.cc-pb-loading {
      border-color: rgba(239,68,68,.65) !important;
    }
    .cc-pb-box.cc-pb-focused {
      border-color: rgba(0,180,198,.5) !important;
      box-shadow: 0 0 0 4px rgba(0,180,198,.1), 0 8px 36px rgba(0,0,0,.24) !important;
    }
    .cc-pb-box.cc-pb-rec-on {
      border-color: rgba(239,68,68,.55) !important;
    }

    /* Image preview */
    .cc-pb-files {
      display: flex; gap: 8px;
      padding: 4px 4px 8px;
      animation: cc-wlc .2s ease both;
    }
    .cc-pb-thumb {
      position: relative;
      width: 64px; height: 64px;
      border-radius: 12px; overflow: hidden;
      cursor: pointer; border: 1px solid rgba(255,255,255,.1);
    }
    .cc-pb-thumb img { width:100%; height:100%; object-fit:cover; transition:opacity .2s; }
    .cc-pb-thumb:hover img { opacity:.88; }
    .cc-pb-rm {
      position: absolute; top: 4px; right: 4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(0,0,0,.78); border: none;
      display: flex; align-items: center; justify-content: center;
      color: #fff; cursor: pointer; transition: background .15s;
    }
    .cc-pb-rm:hover { background: rgba(0,0,0,.95); }

    /* Textarea wrapper */
    .cc-pb-ta-wrap { overflow: hidden; transition: opacity .2s ease; }
    .cc-pb-ta-wrap.cc-pb-ta-gone {
      height: 0 !important; overflow: hidden !important;
      opacity: 0 !important; pointer-events: none !important;
    }

    /* Textarea */
    .cc-pb-ta {
      display: block; width: 100%; box-sizing: border-box;
      min-height: 44px; max-height: 200px;
      padding: 10px 14px;
      background: transparent; border: none; outline: none;
      resize: none; overflow: hidden;
      color: rgba(255,255,255,.92);
      font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.55;
    }
    .cc-pb-ta::placeholder { color: #555a65; }
    .cc-pb-ta:disabled { opacity: .4; }

    /* Voice recorder visualizer */
    .cc-pb-recorder {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 12px 8px 6px;
      animation: cc-wlc .25s ease both;
    }
    .cc-pb-rec-hd {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: rgba(255,255,255,.7);
      font-family: 'Courier New', monospace;
    }
    .cc-rec-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #ef4444;
      animation: cc-rec-blink 1s ease-in-out infinite;
    }
    .cc-rec-time { font-weight: 700; letter-spacing: .05em; }
    @keyframes cc-rec-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
    .cc-pb-bars {
      display: flex; align-items: flex-end; gap: 2px;
      height: 40px; width: 100%;
      padding: 0 12px; justify-content: center;
    }
    .cc-bar {
      width: 2px; border-radius: 2px; flex-shrink: 0;
      background: linear-gradient(to top, #00B4C6, rgba(0,180,198,.4));
      transform-origin: bottom;
      animation: cc-bw .8s ease-in-out infinite;
    }
    @keyframes cc-bw {
      0%,100% { transform: scaleY(.2); opacity: .3; }
      50%      { transform: scaleY(1); opacity: 1;  }
    }

    /* Action row */
    .cc-pb-actions {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 4px 4px 2px;
    }
    .cc-pb-left {
      display: flex; align-items: center; gap: 2px;
      transition: opacity .25s;
    }
    .cc-pb-left-gone { opacity: 0 !important; pointer-events: none !important; }

    /* Attach icon button */
    .cc-pb-icon-btn {
      width: 32px; height: 32px; border-radius: 50%;
      background: transparent; border: none;
      color: #5c6170; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .18s, color .18s;
    }
    .cc-pb-icon-btn:hover { background: rgba(58,58,72,.65); color: #c8ccd5; }

    /* Mode toggle buttons */
    .cc-pb-toggle {
      display: flex; align-items: center; gap: 4px;
      height: 32px; padding: 0 8px;
      border-radius: 999px;
      background: transparent; border: 1px solid transparent;
      color: #5c6170; cursor: pointer;
      font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all .2s ease;
    }
    .cc-pb-toggle:hover { color: #c8ccd5; }

    .cc-pb-lbl {
      max-width: 0; opacity: 0; overflow: hidden;
      white-space: nowrap;
      transition: max-width .22s ease, opacity .22s ease;
      font-weight: 700; font-size: 11.5px;
    }
    .cc-pb-lbl.cc-pb-lbl-on { max-width: 72px; opacity: 1; }

    .cc-pb-ts { background: rgba(0,180,198,.14) !important; border-color: rgba(0,180,198,.9) !important; color: #00B4C6 !important; }
    .cc-pb-tt { background: rgba(139,92,246,.14) !important; border-color: rgba(139,92,246,.9) !important; color: #8B5CF6 !important; }
    .cc-pb-tc { background: rgba(249,115,22,.14) !important; border-color: rgba(249,115,22,.9) !important; color: #F97316 !important; }

    .cc-pb-sep {
      width: 1.5px; height: 22px; flex-shrink: 0;
      background: linear-gradient(to bottom, transparent, rgba(0,180,198,.4), transparent);
      border-radius: 999px; margin: 0 2px;
    }

    /* Send button */
    .cc-pb-send {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: transparent; border: none;
      color: #5c6170; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s ease;
    }
    .cc-pb-send:hover { background: rgba(58,58,72,.65); color: #c8ccd5; }
    .cc-pb-send.cc-pb-send-on { background: #fff !important; color: #1a1a22 !important; }
    .cc-pb-send.cc-pb-send-on:hover { background: rgba(255,255,255,.88) !important; transform: scale(1.07); }
    .cc-pb-send.cc-pb-send-stop { color: #ef4444 !important; }
    .cc-pb-send.cc-pb-send-stop:hover { background: rgba(58,58,72,.65) !important; }

    /* Chips */
    .cc-chips { display:flex; align-items:center; flex-wrap:wrap; gap:7px; }
    .cc-chips-lbl { font-size:11px; color:rgba(26,32,53,.38); white-space:nowrap; }
    .cc-chip {
      padding:5px 13px; border-radius:999px;
      background:rgba(255,255,255,.45); border:1px solid rgba(188,196,232,.4);
      color:rgba(26,32,53,.52); font-size:12px;
      cursor:pointer; font-family:inherit; transition:all .2s;
      backdrop-filter: blur(6px);
    }
    .cc-chip:hover {
      background:rgba(255,255,255,.82); border-color:rgba(0,180,198,.4);
      color:#007A8A;
    }

    @keyframes cc-spin { to { transform:rotate(360deg); } }
  `],
})
export class StudentChat implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollRef') scrollRef!: ElementRef<HTMLDivElement>;
  @ViewChild('ta')        taRef!: ElementRef<HTMLTextAreaElement>;

  messages = signal<Msg[]>([]);
  typing   = signal(false);
  draft    = '';
  focused  = false;
  actions  = ACTIONS;
  chips    = CHIPS;
  bars     = BARS;

  // Mode toggles
  showSearch  = false;
  showThink   = false;
  showCanvas  = false;

  // Voice recording
  isRecording = false;
  recTime     = 0;
  private recInterval: ReturnType<typeof setInterval> | null = null;

  // File attachment
  filePreview: string | null = null;

  constructor(
    public  auth:      AuthService,
    private api:       ApiService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {}

  ngAfterViewChecked() {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy() {
    if (this.recInterval) clearInterval(this.recInterval);
  }

  // ── Computed helpers ──────────────────────────────────────────

  get placeholder(): string {
    if (this.showSearch) return 'Rechercher dans les cours...';
    if (this.showThink)  return 'Analyser en profondeur...';
    if (this.showCanvas) return 'Créer un résumé...';
    return 'Posez votre question à EduBot…';
  }

  get hasDraft(): boolean {
    return this.draft.trim() !== '' || this.filePreview !== null;
  }

  get sendState(): 'loading' | 'recording' | 'active' | 'mic' {
    if (this.typing())    return 'loading';
    if (this.isRecording) return 'recording';
    if (this.hasDraft)    return 'active';
    return 'mic';
  }

  // ── Actions ───────────────────────────────────────────────────

  resize() {
    const el = this.taRef?.nativeElement;
    if (!el) return;
    el.style.height = '44px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  sendSuggestion(t: string) { this.draft = t; this.send(); }
  clearChat() { this.messages.set([]); }

  toggleMode(mode: 'search' | 'think' | 'canvas') {
    this.showSearch = mode === 'search' ? !this.showSearch : false;
    this.showThink  = mode === 'think'  ? !this.showThink  : false;
    this.showCanvas = mode === 'canvas' ? !this.showCanvas : false;
  }

  onSendBtn() {
    if (this.isRecording) { this.stopRec(); }
    else if (this.hasDraft) { this.send(); }
    else { this.startRec(); }
  }

  startRec() {
    this.isRecording = true;
    this.recTime = 0;
    this.recInterval = setInterval(() => this.recTime++, 1000);
  }

  stopRec() {
    if (this.recInterval) { clearInterval(this.recInterval); this.recInterval = null; }
    this.isRecording = false;
    this.recTime = 0;
  }

  formatTime(s: number): string {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.filePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeFile() { this.filePreview = null; }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.filePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toHtml(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  send() {
    const text = this.draft.trim();
    if ((!text && !this.filePreview) || this.typing()) return;

    let message = text;
    if (this.showSearch) message = `[Chercher: ${text}]`;
    else if (this.showThink)  message = `[Analyser: ${text}]`;
    else if (this.showCanvas) message = `[Résumé: ${text}]`;

    const history = this.messages().map(m => ({ role: m.role, content: m.content }));
    this.messages.update(m => [...m, { role: 'user', content: text || '[Image jointe]' }]);
    this.draft = '';
    this.filePreview = null;
    setTimeout(() => this.resize(), 0);
    this.typing.set(true);

    this.api.post<any>('/ai/chat', { message: message || '[Image jointe]', history }).subscribe({
      next: (res: any) => {
        this.typing.set(false);
        const reply = typeof res === 'string'
          ? res : (res?.response ?? res?.content ?? res?.message ?? 'Aucune réponse reçue.');
        this.messages.update(m => [...m, { role: 'assistant', content: String(reply) }]);
      },
      error: () => {
        this.typing.set(false);
        this.messages.update(m => [...m, {
          role:    'assistant',
          content: 'Service temporairement indisponible. Réessayez dans un instant.',
        }]);
      },
    });
  }
}
