import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateShipmentPayload,
  Shipment,
  ShipmentListResponse,
  ShipmentStatus,
  UpdateStatusPayload,
  VehicleAssignmentResult,
} from '../models/shipment.model';

@Injectable({
  providedIn: 'root',
})
export class ShipmentsService {
  private readonly API_URL = 'http://localhost:3000/shipments';

  constructor(private http: HttpClient) {}

  getShipments(
    page: number = 1,
    limit: number = 10,
    status?: ShipmentStatus,
  ): Observable<ShipmentListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ShipmentListResponse>(this.API_URL, { params });
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.API_URL}/${id}`);
  }

  createShipment(payload: CreateShipmentPayload): Observable<Shipment> {
    return this.http.post<Shipment>(this.API_URL, payload);
  }

  updateStatus(id: string, payload: UpdateStatusPayload): Observable<Shipment> {
    return this.http.patch<Shipment>(`${this.API_URL}/${id}/status`, payload);
  }

  cancelShipment(id: string): Observable<Shipment> {
    return this.http.delete<Shipment>(`${this.API_URL}/${id}`);
  }

  assignVehicles(
    shipmentIds: string[],
    vehicleCapacity: number,
  ): Observable<VehicleAssignmentResult> {
    return this.http.post<VehicleAssignmentResult>(`${this.API_URL}/assign-vehicles`, {
      shipmentIds,
      vehicleCapacity,
    });
  }
}
