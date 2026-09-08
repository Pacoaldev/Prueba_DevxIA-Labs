import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShipmentStatus } from '../models/shipment.model';

export interface PublicTrackingEvent {
  status: ShipmentStatus;
  occurredAt: string;
  location: string;
  notes: string;
}

export interface PublicTrackingInfo {
  trackingCode: string;
  status: ShipmentStatus;
  originAddress: string;
  destinationAddress: string;
  recipientName: string;
  createdAt: string;
  deliveredAt: string | null;
  events: PublicTrackingEvent[];
}

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private readonly API_URL = 'http://localhost:3000/tracking';

  constructor(private http: HttpClient) {}

  getPublicTracking(trackingCode: string): Observable<PublicTrackingInfo> {
    return this.http.get<PublicTrackingInfo>(`${this.API_URL}/${trackingCode}`);
  }
}
