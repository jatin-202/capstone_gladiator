import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { HttpService } from '../../../services/http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  totalBookings = 0;
  totalFlights = 0;
  activeFlights = 0;

  // Passenger
  upcomingTrips = 0;
  recentBookings: any[] = [];

  // Pilot
  assignedFlights = 0;
  flightHours = 0;
  pilotFlights: any[] = [];

  constructor(
    public authService: AuthService,
    private httpService: HttpService
  ) { }

  ngOnInit(): void {

    if (this.role === 'ADMIN') {
      this.loadAdminStats();
    }

    if (this.role === 'PASSENGER') {
      this.loadPassengerStats();
    }

    if (this.role === 'PILOT') {
      this.loadPilotStats();
    }
  }

  get role(): string {
    return this.authService.getRole;
  }

  // ================= ADMIN =================
  loadAdminStats() {

    this.httpService.getAllBookings().subscribe({
      next: (data: any[]) => {
        this.totalBookings = data.length;
      },
      error: () => this.totalBookings = 0
    });

    this.httpService.getAllFlights().subscribe({
      next: (data: any[]) => {
        this.totalFlights = data.length;

        this.activeFlights = data.filter(f =>
          f.status === 'SCHEDULED' || f.status === 'BOARDING'
        ).length;
      },
      error: () => {
        this.totalFlights = 0;
        this.activeFlights = 0;
      }
    });
  }

  // ================= PASSENGER =================
  loadPassengerStats() {

    this.httpService.getMyBookings().subscribe({
      next: (data: any[]) => {

        this.totalBookings = data.length;

        const today = new Date();

        // ✅ FIXED: UPCOMING TRIPS
        this.upcomingTrips = data.filter(b => {

          if (!b.flight) return false;

          const date = b.flight.departureDate;
          const time = b.flight.departureTime;

          if (!date || !time) return false;

          const flightDateTime = new Date(`${date}T${time}`);

          return flightDateTime >= today;

        }).length;

        // ✅ FIXED: SORTING
        this.recentBookings = data
          .sort((a, b) => {

            const dateA = new Date(`${a.flight?.departureDate}T${a.flight?.departureTime}`);
            const dateB = new Date(`${b.flight?.departureDate}T${b.flight?.departureTime}`);

            return dateB.getTime() - dateA.getTime();

          })
          .slice(0, 3);

      },
      error: () => {
        this.totalBookings = 0;
        this.upcomingTrips = 0;
        this.recentBookings = [];
      }
    });
  }

  // ================= PILOT =================
  loadPilotStats() {

    this.httpService.getMySchedule().subscribe({
      next: (data: any[]) => {

        this.pilotFlights = data;
        this.assignedFlights = data.length;

        // ✅ FIXED FLIGHT HOURS
        this.flightHours = data.reduce((total, item) => {

          if (!item.flight) return total;

          const dep = item.flight.departureTime;
          const arr = item.flight.arrivalTime;

          if (!dep || !arr) return total;

          const getMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
          };

          const depMin = getMinutes(dep);
          const arrMin = getMinutes(arr);

          let duration = arrMin - depMin;

          if (duration < 0) duration += 24 * 60;

          return total + duration;

        }, 0);

        this.flightHours = Math.round(this.flightHours / 60);

      },
      error: () => {
        this.pilotFlights = [];
        this.assignedFlights = 0;
        this.flightHours = 0;
      }
    });
  }

}