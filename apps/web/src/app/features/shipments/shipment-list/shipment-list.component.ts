import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ShipmentsService } from '../../../core/services/shipments.service';
import {
  Shipment,
  ShipmentStatus,
  STATUS_LABELS,
  VehicleAssignmentResult,
} from '../../../core/models/shipment.model';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="layout">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">TransLog - Operativa</div>
        <div class="user-info">
          <span>{{ currentUser()?.email }} ({{ currentUser()?.role }})</span>
          <button *ngIf="isSupervisor()" routerLink="/register" class="btn-secondary">
            Registrar Usuario
          </button>
          <button (click)="logout()" class="btn-danger">Cerrar Sesión</button>
        </div>
      </nav>

      <main class="content">
        <div class="header-actions">
          <h2>Gestión de Envíos</h2>
          <div class="actions">
            <button (click)="openAssignModal()" class="btn-secondary">Asignar Vehículos (FFD)</button>
            <button (click)="openCreateModal()" class="btn-primary">+ Nuevo Envío</button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-card">
          <label>Filtrar por Estado:</label>
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">Todos los Estados</option>
            <option *ngFor="let s of statusOptions" [value]="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>Código Tracking</th>
                <th>Destinatario</th>
                <th>Destino</th>
                <th>Peso (kg)</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="8" class="text-center">Cargando envíos...</td>
              </tr>
              <tr *ngIf="!loading && shipments.length === 0">
                <td colspan="8" class="text-center">No se encontraron envíos.</td>
              </tr>
              <tr *ngFor="let s of shipments">
                <td>
                  <input
                    type="checkbox"
                    [disabled]="s.status !== ShipmentStatus.IN_WAREHOUSE"
                    [checked]="isShipmentSelected(s.id)"
                    (change)="toggleSelectShipment(s.id)"
                  />
                </td>
                <td class="font-mono"><strong>{{ s.trackingCode }}</strong></td>
                <td>{{ s.recipientName }}</td>
                <td>{{ s.destinationAddress }}</td>
                <td>{{ s.weightKg }} kg</td>
                <td>
                  <span class="badge" [ngClass]="s.status.toLowerCase()">
                    {{ getStatusLabel(s.status) }}
                  </span>
                </td>
                <td>{{ s.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <a [routerLink]="['/shipments', s.id]" class="btn-link">Ver Detalle</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">Anterior</button>
          <span>Página {{ currentPage }} de {{ totalPages }}</span>
          <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">Siguiente</button>
        </div>
      </main>

      <!-- Modal Crear Envío -->
      <div class="modal-backdrop" *ngIf="showCreateModal">
        <div class="modal">
          <h3>Crear Nuevo Envío</h3>
          <form [formGroup]="createForm" (ngSubmit)="onCreateSubmit()">
            <div class="form-group">
              <label>Dirección de Origen</label>
              <input formControlName="originAddress" placeholder="Almacén Central Madrid" />
            </div>
            <div class="form-group">
              <label>Dirección de Destino</label>
              <input formControlName="destinationAddress" placeholder="Av. Diagonal 123, Barcelona" />
            </div>
            <div class="form-group">
              <label>Nombre del Destinatario</label>
              <input formControlName="recipientName" placeholder="Juan Pérez" />
            </div>
            <div class="form-group">
              <label>Teléfono de Contacto (Opcional)</label>
              <input formControlName="contactPhone" placeholder="+34 600 000 000" />
            </div>
            <div class="form-group">
              <label>Peso (kg)</label>
              <input type="number" step="0.1" formControlName="weightKg" placeholder="15.5" />
            </div>

            <div *ngIf="createError" class="alert-error">{{ createError }}</div>

            <div class="modal-actions">
              <button type="button" (click)="closeCreateModal()" class="btn-secondary">Cancelar</button>
              <button type="submit" [disabled]="createForm.invalid || creating" class="btn-primary">
                {{ creating ? 'Guardando...' : 'Crear Envío' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Asignación de Vehículos -->
      <div class="modal-backdrop" *ngIf="showAssignModal">
        <div class="modal modal-lg">
          <h3>Asignar Vehículos (First Fit Decreasing)</h3>
          <p>Seleccione envíos en almacén (IN_WAREHOUSE) e ingrese la capacidad máxima por vehículo.</p>

          <div class="form-group">
            <label>Capacidad Máxima por Vehículo (kg)</label>
            <input type="number" [(ngModel)]="vehicleCapacity" placeholder="100" />
          </div>

          <p>Envíos seleccionados: <strong>{{ selectedShipmentIds.length }}</strong></p>

          <div *ngIf="assignError" class="alert-error">{{ assignError }}</div>

          <button
            (click)="runVehicleAssignment()"
            [disabled]="selectedShipmentIds.length === 0 || vehicleCapacity <= 0 || assigning"
            class="btn-primary"
          >
            {{ assigning ? 'Calculando...' : 'Ejecutar Algoritmo FFD' }}
          </button>

          <!-- Resultados -->
          <div *ngIf="assignmentResult" class="results-container">
            <h4>Resultado de Asignación</h4>
            <p>Total vehículos usados: <strong>{{ assignmentResult.totalVehiclesUsed }}</strong> | Peso total: <strong>{{ assignmentResult.totalWeight }} kg</strong></p>

            <div *ngFor="let v of assignmentResult.vehicles" class="vehicle-card">
              <h5>Vehículo #{{ v.vehicleNumber }} — Ocupación: {{ v.totalWeight }} kg (Restante: {{ v.remainingCapacity }} kg)</h5>
              <ul>
                <li *ngFor="let item of v.shipments">
                  {{ item.trackingCode }} — {{ item.weight }} kg
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 1.5rem;">
            <button (click)="closeAssignModal()" class="btn-secondary">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; }
    .navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #0f172a; color: white; }
    .logo { font-size: 1.25rem; font-weight: bold; }
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .actions { display: flex; gap: 0.75rem; }
    .filters-card { background: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .filters-card select { padding: 0.5rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
    th { background: #f1f5f9; color: #475569; font-weight: 600; }
    .font-mono { font-family: monospace; }
    .text-center { text-align: center; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge.created { background: #e0f2fe; color: #0369a1; }
    .badge.in_warehouse { background: #fef3c7; color: #92400e; }
    .badge.in_transit { background: #e0e7ff; color: #3730a3; }
    .badge.out_for_delivery { background: #fae8ff; color: #86198f; }
    .badge.delivered { background: #dcfce7; color: #166534; }
    .badge.returned { background: #ffedd5; color: #9a3412; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
    .pagination button { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-link { color: #2563eb; text-decoration: none; font-weight: 500; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
    .modal { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 700px; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #334155; }
    .form-group input { width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .alert-error { background: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; border: 1px solid #fecaca; }
    .vehicle-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; margin-top: 0.75rem; }
    .vehicle-card h5 { margin: 0 0 0.5rem; color: #0f172a; }
  `],
})
export class ShipmentListComponent implements OnInit {
  ShipmentStatus = ShipmentStatus;
  shipments: Shipment[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  selectedStatus: string = '';
  selectedShipmentIds: string[] = [];

  statusOptions = Object.keys(ShipmentStatus).map((key) => ({
    value: key,
    label: STATUS_LABELS[key as ShipmentStatus],
  }));

  // Modal Crear
  showCreateModal = false;
  createForm: FormGroup;
  creating = false;
  createError = '';

  // Modal Asignar Vehículos
  showAssignModal = false;
  vehicleCapacity = 100;
  assigning = false;
  assignError = '';
  assignmentResult: VehicleAssignmentResult | null = null;

  constructor(
    private shipmentsService: ShipmentsService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      originAddress: ['', Validators.required],
      destinationAddress: ['', Validators.required],
      recipientName: ['', Validators.required],
      contactPhone: [''],
      weightKg: [1.0, [Validators.required, Validators.min(0.1)]],
    });
  }

  ngOnInit(): void {
    this.loadShipments();
  }

  currentUser() {
    return this.authService.currentUser();
  }

  isSupervisor() {
    return this.authService.isSupervisor();
  }

  logout() {
    this.authService.logout();
  }

  getStatusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status] || status;
  }

  loadShipments(): void {
    this.loading = true;
    const statusParam = this.selectedStatus ? (this.selectedStatus as ShipmentStatus) : undefined;
    this.shipmentsService.getShipments(this.currentPage, 10, statusParam).subscribe({
      next: (res) => {
        this.shipments = res.data;
        this.totalPages = res.meta.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadShipments();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadShipments();
    }
  }

  isShipmentSelected(id: string): boolean {
    return this.selectedShipmentIds.includes(id);
  }

  toggleSelectShipment(id: string): void {
    if (this.isShipmentSelected(id)) {
      this.selectedShipmentIds = this.selectedShipmentIds.filter((item) => item !== id);
    } else {
      this.selectedShipmentIds.push(id);
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.createForm.reset({ weightKg: 1.0 });
    this.createError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) return;

    this.creating = true;
    this.createError = '';

    this.shipmentsService.createShipment(this.createForm.value).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreateModal();
        this.loadShipments();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err.error?.message || 'Error al crear el envío.';
      },
    });
  }

  openAssignModal(): void {
    this.showAssignModal = true;
    this.assignError = '';
    this.assignmentResult = null;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
  }

  runVehicleAssignment(): void {
    if (this.selectedShipmentIds.length === 0 || this.vehicleCapacity <= 0) return;

    this.assigning = true;
    this.assignError = '';

    this.shipmentsService
      .assignVehicles(this.selectedShipmentIds, this.vehicleCapacity)
      .subscribe({
        next: (result) => {
          this.assigning = false;
          this.assignmentResult = result;
        },
        error: (err) => {
          this.assigning = false;
          this.assignError = err.error?.message || 'Error al calcular la asignación de vehículos.';
        },
      });
  }
}
