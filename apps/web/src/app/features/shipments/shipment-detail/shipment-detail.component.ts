import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShipmentsService } from '../../../core/services/shipments.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Shipment,
  ShipmentStatus,
  STATUS_LABELS,
  VALID_TRANSITIONS,
} from '../../../core/models/shipment.model';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="layout">
      <nav class="navbar">
        <a routerLink="/shipments" class="btn-back">← Volver al Listado</a>
        <span class="logo">Detalle de Envío</span>
      </nav>

      @if (shipment(); as s) {
        <main class="content">
          <!-- Main Info Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <span class="tracking-title">{{ s.trackingCode }}</span>
                <span class="badge" [ngClass]="s.status.toLowerCase()">
                  {{ getStatusLabel(s.status) }}
                </span>
              </div>
              <div class="actions">
                @if (canCancel()) {
                  <button (click)="onCancelShipment()" class="btn-danger">Cancelar Envío</button>
                }
                @if (getAvailableNextStatuses().length > 0) {
                  <button (click)="openStatusModal()" class="btn-primary">Cambiar Estado</button>
                }
              </div>
            </div>

            <div class="info-grid">
              <div>
                <span class="label">Destinatario:</span>
                <span class="value">{{ s.recipientName }}</span>
              </div>
              <div>
                <span class="label">Teléfono:</span>
                <span class="value">{{ s.contactPhone || 'No especificado' }}</span>
              </div>
              <div>
                <span class="label">Origen:</span>
                <span class="value">{{ s.originAddress }}</span>
              </div>
              <div>
                <span class="label">Destino:</span>
                <span class="value">{{ s.destinationAddress }}</span>
              </div>
              <div>
                <span class="label">Peso:</span>
                <span class="value">{{ s.weightKg }} kg</span>
              </div>
              <div>
                <span class="label">Fecha Creación:</span>
                <span class="value">{{ s.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
              @if (s.deliveredAt) {
                <div>
                  <span class="label">Fecha Entrega:</span>
                  <span class="value font-bold text-success">{{ s.deliveredAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- History Timeline Card -->
          <div class="card" style="margin-top: 1.5rem;">
            <h3>Historial de Eventos de Seguimiento</h3>
            <div class="timeline">
              @for (ev of s.events; track ev.id) {
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="badge" [ngClass]="ev.status.toLowerCase()">
                        {{ getStatusLabel(ev.status) }}
                      </span>
                      <span class="timeline-date">{{ ev.occurredAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p><strong>Ubicación:</strong> {{ ev.location }}</p>
                    <p><strong>Notas:</strong> {{ ev.notes }}</p>
                    @if (ev.user) {
                      <p class="timeline-user">Registrado por: {{ ev.user.email }} ({{ ev.user.role }})</p>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </main>
      }

      <!-- Modal Cambio de Estado -->
      @if (showStatusModal()) {
        <div class="modal-backdrop">
          <div class="modal">
            <h3>Cambiar Estado de Envío</h3>
            <form [formGroup]="statusForm" (ngSubmit)="onStatusSubmit()">
              <div class="form-group">
                <label>Nuevo Estado</label>
                <select formControlName="status">
                  @for (st of getAvailableNextStatuses(); track st) {
                    <option [value]="st">{{ getStatusLabel(st) }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Ubicación Actual</label>
                <input formControlName="location" placeholder="Centro Logístico Madrid Norte" />
              </div>

              <div class="form-group">
                <label>Notas del Evento</label>
                <textarea formControlName="notes" rows="3" placeholder="Paquete listo para entrega."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeStatusModal()" class="btn-secondary">Cancelar</button>
                <button type="submit" [disabled]="statusForm.invalid || updating()" class="btn-primary">
                  {{ updating() ? 'Actualizando...' : 'Guardar Estado' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .layout { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; }
    .navbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: #0f172a; color: white; }
    .logo { font-size: 1.1rem; font-weight: bold; }
    .btn-back { color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
    .btn-back:hover { color: white; }
    .content { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .tracking-title { font-size: 1.5rem; font-weight: bold; margin-right: 1rem; color: #0f172a; }
    .actions { display: flex; gap: 0.75rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
    .label { display: block; font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge.created { background: #e0f2fe; color: #0369a1; }
    .badge.in_warehouse { background: #fef3c7; color: #92400e; }
    .badge.in_transit { background: #e0e7ff; color: #3730a3; }
    .badge.out_for_delivery { background: #fae8ff; color: #86198f; }
    .badge.delivered { background: #dcfce7; color: #166534; }
    .badge.returned { background: #ffedd5; color: #9a3412; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
    .timeline { position: relative; margin-top: 1.5rem; padding-left: 1.5rem; border-left: 2px solid #e2e8f0; }
    .timeline-item { position: relative; margin-bottom: 1.5rem; }
    .timeline-marker { position: absolute; left: -1.95rem; top: 0.25rem; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; border: 2px solid white; }
    .timeline-content { background: #f8fafc; border-radius: 8px; padding: 1rem; border: 1px solid #e2e8f0; }
    .timeline-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .timeline-date { font-size: 0.8rem; color: #64748b; }
    .timeline-user { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; }
    .timeline-content p { margin: 0.2rem 0; font-size: 0.9rem; color: #334155; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
    .modal { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 480px; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #334155; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `],
})
export class ShipmentDetailComponent implements OnInit {
  shipment = signal<Shipment | null>(null);
  shipmentId = '';
  showStatusModal = signal(false);
  statusForm: FormGroup;
  updating = signal(false);

  constructor(
    private route: ActivatedRoute,
    private shipmentsService: ShipmentsService,
    private toast: ToastService,
    private fb: FormBuilder,
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      location: ['', Validators.required],
      notes: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.shipmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.shipmentId) {
      this.loadShipment();
    }
  }

  loadShipment(): void {
    this.shipmentsService.getShipmentById(this.shipmentId).subscribe({
      next: (data) => {
        this.shipment.set(data);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al cargar el detalle del envío.');
      },
    });
  }

  getStatusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status] || status;
  }

  getAvailableNextStatuses(): ShipmentStatus[] {
    const s = this.shipment();
    if (!s) return [];
    return VALID_TRANSITIONS[s.status] || [];
  }

  canCancel(): boolean {
    const s = this.shipment();
    if (!s) return false;
    return (
      s.status !== ShipmentStatus.DELIVERED &&
      s.status !== ShipmentStatus.RETURNED &&
      s.status !== ShipmentStatus.CANCELLED
    );
  }

  openStatusModal(): void {
    const nextStatuses = this.getAvailableNextStatuses();
    if (nextStatuses.length === 0) return;

    this.showStatusModal.set(true);
    this.statusForm.reset({
      status: nextStatuses[0],
      location: this.shipment()?.destinationAddress || '',
      notes: '',
    });
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
  }

  onStatusSubmit(): void {
    if (this.statusForm.invalid) return;

    this.updating.set(true);

    this.shipmentsService
      .updateStatus(this.shipmentId, this.statusForm.value)
      .subscribe({
        next: (updated) => {
          this.shipment.set(updated);
          this.updating.set(false);
          this.closeStatusModal();
          this.toast.success('Estado del envío actualizado.');
        },
        error: (err) => {
          this.updating.set(false);
          this.toast.error(err.error?.message || 'Error al cambiar el estado.');
        },
      });
  }

  onCancelShipment(): void {
    if (!confirm('¿Está seguro de que desea cancelar este envío?')) return;

    this.shipmentsService.cancelShipment(this.shipmentId).subscribe({
      next: (cancelled) => {
        this.shipment.set(cancelled);
        this.toast.success('Envío cancelado.');
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al cancelar el envío.');
      },
    });
  }
}
