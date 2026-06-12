import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { Sidebar } from '../../../shared/sidebar/sidebar';

interface Msg { role: 'user' | 'assistant'; content: string; }

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  animations: [
    trigger('msgIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('250ms cubic-bezier(0.23,1,0.32,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="shell">
      <app-sidebar [role]="auth.role() ?? ''" [userName]="auth.user()?.name ?? ''" />

      <main class="main-area">
        <header class="topbar">
          <div class="flex items-center gap-3">
            <div class="ai-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <h1 class="topbar-title">EduBot <span class="gt">IA</span></h1>
              <p class="topbar-sub flex items-center gap-1.5">
                <span class="online-dot"></span> En ligne · Assistant pédagogique
              </p>
            </div>
          </div>
          <button class="btn-secondary text-xs" (click)="clearChat()">Nouvelle conversation</button>
        </header>

        <div class="chat-area" #scrollContainer>
          <!-- Welcome -->
          <div *ngIf="messages().length === 0" class="welcome">
            <div class="welcome-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h2 class="text-xl font-bold font-display" style="color:#221f2c">Bonjour, je suis <span class="gt">EduBot</span> !</h2>
            <p style="color:#948da3;font-size:14px;max-width:360px;text-align:center">
              Votre assistant pédagogique IA. Posez-moi vos questions sur vos cours, votre progression ou les évaluations.
            </p>
            <div class="suggestions">
              <button *ngFor="let s of suggestions" (click)="sendSuggestion(s)" class="suggestion-chip">{{ s }}</button>
            </div>
          </div>

          <!-- Messages -->
          <div *ngFor="let m of messages()" @msgIn class="msg-wrapper" [class.msg-user]="m.role==='user'">
            <div *ngIf="m.role==='assistant'" class="bot-avatar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>

            <div class="bubble" [class.bubble-user]="m.role==='user'" [class.bubble-bot]="m.role==='assistant'"
              [innerHTML]="m.role==='assistant' ? toHtml(m.content) : m.content">
            </div>
          </div>

          <!-- Typing -->
          <div *ngIf="typing()" class="msg-wrapper">
            <div class="bot-avatar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="bubble bubble-bot flex items-center gap-1.5 px-4 py-3">
              <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="input-bar">
          <input [(ngModel)]="inputText" (keydown.enter)="send()" class="chat-input"
            placeholder="Posez votre question…" [disabled]="typing()" />
          <button (click)="send()" class="send-btn" [disabled]="!inputText.trim() || typing()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell { display:flex;height:100vh;overflow:hidden;background:linear-gradient(160deg,#fffdfb 0%,#fdf2f8 60%,#f6f0ff 100%); }
    .main-area { flex:1;display:flex;flex-direction:column;overflow:hidden; }
    .topbar { display:flex;align-items:center;justify-content:space-between;padding:18px 26px;border-bottom:1px solid rgba(167,139,250,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px); flex-shrink:0; }
    .topbar-title { font-family:'Fraunces',Georgia,serif;font-size:18px;font-weight:700;color:#221f2c;margin:0; }
    .topbar-sub { font-size:12px;color:#948da3;margin:2px 0 0; display:flex;align-items:center;gap:6px; }
    .online-dot { width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 6px rgba(52,211,153,.6); }
    .ai-badge { width:38px;height:38px;border-radius:13px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(167,139,250,.4); }
    .gt { background:linear-gradient(135deg,#a78bfa,#fb7299);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-flow 5s linear infinite; }

    .chat-area { flex:1;overflow-y:auto;padding:22px 26px;display:flex;flex-direction:column;gap:14px; }

    .welcome { display:flex;flex-direction:column;align-items:center;gap:16px;padding:60px 20px; }
    .welcome-icon { width:64px;height:64px;border-radius:22px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(167,139,250,.4); }
    .suggestions { display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px; }
    .suggestion-chip { padding:9px 17px;border-radius:100px;background:rgba(167,139,250,.07);border:1px solid rgba(167,139,250,.18);color:#7c5ce0;font-size:13px;font-weight:600;cursor:pointer;transition:all .22s cubic-bezier(.16,1,.3,1);font-family:inherit; }
    .suggestion-chip:hover { background:#fff;border-color:rgba(167,139,250,.4);transform:translateY(-2px);box-shadow:0 8px 22px rgba(167,139,250,.18); }

    .msg-wrapper { display:flex;align-items:flex-start;gap:10px; }
    .msg-user { flex-direction:row-reverse; }
    .bot-avatar { width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#fb7299);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px; }

    .bubble { max-width:70%;padding:11px 16px;font-size:13.5px;line-height:1.6;word-break:break-word; }
    .bubble-user { background:linear-gradient(135deg,#a78bfa,#fb7299);border-radius:18px 18px 4px 18px;color:white;box-shadow:0 8px 22px rgba(167,139,250,.3); }
    .bubble-bot { background:#fff;border:1px solid rgba(167,139,250,.16);border-radius:18px 18px 18px 4px;color:#4a4458;box-shadow:0 4px 16px rgba(167,139,250,.1); }
    .bubble-bot ::ng-deep strong { color:#221f2c;font-weight:700; }
    .bubble-bot ::ng-deep p { margin:0 0 6px; }
    .bubble-bot ::ng-deep p:last-child { margin:0; }

    .input-bar { display:flex;gap:10px;padding:18px 26px;border-top:1px solid rgba(167,139,250,.12);background:rgba(255,253,251,.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);flex-shrink:0; }
    .chat-input { flex:1;padding:12px 18px;border-radius:14px;background:#f8f1fc;border:1px solid rgba(167,139,250,.16);color:#221f2c;font-size:14px;font-family:inherit;outline:none;transition:all .25s cubic-bezier(.16,1,.3,1); }
    .chat-input:focus { border-color:#a78bfa;background:#fff;box-shadow:0 0 0 4px rgba(167,139,250,.16); }
    .chat-input::placeholder { color:#c4bdd6; }
    .send-btn { width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#a78bfa,#fb7299);border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.16,1,.3,1);flex-shrink:0;box-shadow:0 8px 22px rgba(167,139,250,.32); }
    .send-btn:hover:not(:disabled) { box-shadow:0 10px 28px rgba(167,139,250,.45);transform:scale(1.06); }
    .send-btn:disabled { opacity:.4;cursor:not-allowed; }
  `],
})
export class StudentChat implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  messages = signal<Msg[]>([]);
  typing   = signal(false);
  inputText = '';

  suggestions = [
    'Montre-moi ma progression',
    'Que recommandes-tu ?',
    'Quels cours sont disponibles ?',
    'Comment vont mes quiz ?',
  ];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/chat/history').subscribe({
      next: (history: any[]) => {
        if (history?.length) {
          this.messages.set(history.map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content ?? '',
          })));
        }
      },
      error: () => {},
    });
  }

  ngAfterViewChecked() {
    const el = this.scrollContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendSuggestion(text: string) { this.inputText = text; this.send(); }

  clearChat() { this.messages.set([]); }

  toHtml(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  send() {
    const text = this.inputText.trim();
    if (!text) return;

    const history = this.messages().map(m => ({ role: m.role, content: m.content }));
    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.inputText = '';
    this.typing.set(true);

    this.api.post<any>('/chat', { message: text, history }).subscribe({
      next: (res: any) => {
        this.typing.set(false);
        const reply = res?.content ?? res?.message ?? res ?? 'Aucune réponse reçue.';
        this.messages.update(m => [...m, { role: 'assistant', content: String(reply) }]);
      },
      error: () => {
        this.typing.set(false);
        this.messages.update(m => [...m, { role: 'assistant', content: 'Service temporairement indisponible. Réessayez dans un instant.' }]);
      },
    });
  }
}
