import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicTrackingInfo, TrackingService } from '../../../core/services/tracking.service';
import { ShipmentStatus, STATUS_LABELS } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-public-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="tracking-page">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">TransLog — Consulta de Envíos</div>
        <a routerLink="/login" class="btn-login">Acceso Operadores</a>
      </nav>

      <main class="container">
        <!-- Search Card -->
        <div class="search-card">
          <h2>Rastrear Paquete</h2>
          <p>Ingrese su código de seguimiento para consultar el estado en tiempo real.</p>
          <form (ngSubmit)="onSearch()" class="search-form">
            <input
              type="text"
              [(ngModel)]="searchCode"
              name="searchCode"
              placeholder="Ej: ENV-20260908-A1B2"
            />
            <button type="submit" [disabled]="!searchCode.trim() || loading()">
              {{ loading() ? 'Buscando...' : 'Buscar' }}
            </button>
          </form>
          @if (errorMessage()) {
            <div class="alert-error">{{ errorMessage() }}</div>
          }
        </div>

        <!-- Tracking Results Card -->
        @if (trackingInfo(); as info) {
          <div class="result-card">
            <div class="result-header">
              <div>
                <span class="tracking-code">{{ info.trackingCode }}</span>
                <span class="badge" [ngClass]="info.status.toLowerCase()">
                  {{ getStatusLabel(info.status) }}
                </span>
              </div>
              <div class="date-created">
                Registrado el {{ info.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </div>
            </div>

            <div class="info-grid">
              <div>
                <span class="label">Destinatario</span>
                <span class="value">{{ info.recipientName }}</span>
              </div>
              <div>
                <span class="label">Origen</span>
                <span class="value">{{ info.originAddress }}</span>
              </div>
              <div>
                <span class="label">Destino</span>
                <span class="value">{{ info.destinationAddress }}</span>
              </div>
              @if (info.deliveredAt) {
                <div>
                  <span class="label">Fecha de Entrega</span>
                  <span class="value font-bold text-success">
                    {{ info.deliveredAt | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
              }
            </div>

            <!-- Timeline -->
            <div class="timeline-section">
              <h3>Historial de Seguimiento</h3>
              <div class="timeline">
                @for (ev of info.events; track ev.occurredAt) {
                  <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-box">
                      <div class="timeline-header">
                        <span class="badge" [ngClass]="ev.status.toLowerCase()">
                          {{ getStatusLabel(ev.status) }}
                        </span>
                        <span class="timeline-time">{{ ev.occurredAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <p class="location"><strong>Ubicación:</strong> {{ ev.location }}</p>
                      <p class="notes"><strong>Estado / Notas:</strong> {{ ev.notes }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .tracking-page { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; }
    .navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #0f172a; color: white; }
    .logo { font-size: 1.25rem; font-weight: bold; }
    .btn-login { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .search-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
    .search-card h2 { margin: 0 0 0.5rem; color: #0f172a; }
    .search-card p { color: #64748b; margin: 0 0 1.5rem; font-size: 0.95rem; }
    .search-form { display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto 1rem; }
    .search-form input { flex: 1; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
    .search-form button { padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .search-form button:disabled { background: #94a3b8; cursor: not-allowed; }
    .alert-error { background: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; margin-top: 1rem; border: 1px solid #fecaca; }
    .result-card { background: white; padding: 2rem; border-radius: 12px; margin-top: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .result-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .tracking-code { font-size: 1.5rem; font-weight: bold; color: #0f172a; margin-right: 0.75rem; font-family: monospace; }
    .date-created { font-size: 0.85rem; color: #64748b; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .label { display: block; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
    .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge.created { background: #e0f2fe; color: #0369a1; }
    .badge.in_warehouse { background: #fef3c7; color: #92400e; }
    .badge.in_transit { background: #e0e7ff; color: #3730a3; }
    .badge.out_for_delivery { background: #fae8ff; color: #86198f; }
    .badge.delivered { background: #dcfce7; color: #166534; }
    .badge.returned { background: #ffedd5; color: #9a3412; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
    .timeline-section h3 { margin: 0 0 1rem; color: #0f172a; font-size: 1.1rem; }
    .timeline { position: relative; padding-left: 1.5rem; border-left: 2px solid #cbd5e1; }
    .timeline-item { position: relative; margin-bottom: 1.25rem; }
    .timeline-dot { position: absolute; left: -1.95rem; top: 0.25rem; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; border: 2px solid white; }
    .timeline-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .timeline-time { font-size: 0.8rem; color: #64748b; }
    .timeline-box p { margin: 0.2rem 0; font-size: 0.88rem; color: #334155; }
  `],
})
export class PublicTrackingComponent implements OnInit {
  searchCode = '';
  loading = signal(false);
  errorMessage = signal('');
  trackingInfo = signal<PublicTrackingInfo | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackingService: TrackingService,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('trackingCode');
    if (code) {
      this.searchCode = code;
      this.fetchTracking(code);
    }
  }

  getStatusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status] || status;
  }

  onSearch(): void {
    if (!this.searchCode.trim()) return;
    this.router.navigate(['/tracking', this.searchCode.trim()]);
    this.fetchTracking(this.searchCode.trim());
  }

  fetchTracking(code: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.trackingInfo.set(null);

    this.trackingService.getPublicTracking(code).subscribe({
      next: (data) => {
        this.trackingInfo.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message || `No se encontró ningún envío con el código ${code}.`,
        );
      },
    });
  }
}
