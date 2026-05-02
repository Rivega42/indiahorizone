/**
 * Trips API client (#A-08, #A-09).
 *
 * GET /trips/me — список trip'ов с RBAC (client → only own).
 * GET /trips/:id — детали trip + bookingsCount + hasPublishedItinerary.
 * GET /trips/:id/itinerary — последняя published-itinerary.
 */
import { apiClient } from './client';

export type TripStatus = 'tentative' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface TripSummary {
  id: string;
  clientId: string;
  status: TripStatus;
  region: string;
  startsAt: string;
  endsAt: string;
  totalAmount: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetail extends TripSummary {
  bookingsCount: number;
  hasPublishedItinerary: boolean;
}

export interface DayPlan {
  dayNumber: number;
  title: string;
  description: string | null;
  location: string | null;
  activities: string[];
}

export interface Itinerary {
  id: string;
  tripId: string;
  version: number;
  publishedAt: string | null;
  days: DayPlan[];
}

export async function listMyTrips(): Promise<{ items: TripSummary[] }> {
  const res = await apiClient.get<{ items: TripSummary[] }>('/trips/me');
  return res.data;
}

export async function getTrip(id: string): Promise<TripDetail> {
  const res = await apiClient.get<TripDetail>(`/trips/${id}`);
  return res.data;
}

export async function getItinerary(tripId: string): Promise<Itinerary | null> {
  try {
    const res = await apiClient.get<Itinerary>(`/trips/${tripId}/itinerary`);
    return res.data;
  } catch (err: unknown) {
    // 404 = нет published itinerary
    const isAxiosError =
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { status?: number } }).response?.status === 404;
    if (isAxiosError) return null;
    throw err;
  }
}
