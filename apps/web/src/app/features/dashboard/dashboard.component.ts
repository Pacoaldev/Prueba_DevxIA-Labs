import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShipmentsService } from '../../core/services/shipments.service';
import { ShipmentStatus, STATUS_LABELS } from '../../core/models/shipment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <nav class="navbar">
        <div class="logo">TransLog - Dashboard</div>
        <a routerLink="/shipments" class="btn-link">Volver a Envíos</a>
        <a routerLink="/tracking" class="btn-link">Consultar Seguimiento Público</a>
      </nav>
      
      <main class="container">
        <h1>Dashboard de Envíos</h1>
        
        @if (loading()) {
          <div class="loading">Cargando estadísticas...</div>
        } @else if (error()) {
          <div class="alert-error">{{ error() }}</div>
        } @else {
          <div class="stats-grid">
            @for (status of statuses; track status) {
              <div class="stat-card">
                <h3>{{ getStatusLabel(status) }}</h3>
                <div class="stat-value">{{ getStatusCount(status) }}</div>
              </div>
            }
            <div class="stat-card">
              <h3>Total Envíos</h3>
              <div class="stat-value">{{ dashboard()?.total || 0 }}</div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .dashboard-page { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; }
    .navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #0f172a; color: white; }
    .logo { font-size: 1.25rem; font-weight: bold; }
    .btn-link { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; }
    .stat-card h3 { margin: 0 0 0.5rem; color: #64748b; font-size: 0.9rem; }
    .stat-value { font-size: 2rem; font-weight: bold; color: #0f172a; }
    .loading { text-align: center; padding: 2rem; color: #64748b; }
    .alert-error { background: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-top: 1rem; border: 1px solid #fecaca; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(false);
  error = signal('');
  dashboard = signal<{ total: number; byStatus: Record<ShipmentStatus, number> } | null>(null);
  
  ShipmentStatus = ShipmentStatus;
  statuses: ShipmentStatus[] = [
    ShipmentStatus.CREATED,
    ShipmentStatus.IN_WAREHOUSE,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.RETURNED,
    ShipmentStatus.CANCELLED,
  ];

  constructor(private shipmentsService: ShipmentsService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  getStatusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status] || status;
  }

  getStatusCount(status: ShipmentStatus): number {
    return this.dashboard()?.byStatus?.[status] ?? 0;
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');
    this.shipmentsService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar el dashboard.');
        this.loading.set(false);
      },
    });
  }
}