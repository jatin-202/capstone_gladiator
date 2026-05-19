import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../services/http.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss']
})
export class FlightSearchComponent implements OnInit {

  searchForm!: FormGroup;
  flights: any[] = [];
  selectedFlight: any = null;
  totalPrice = 0;
  seatNumbers = '';
  selectedSeats: any[] = []; sourceList: string[] = [];
  destinationList: string[] = [];
  dropdownOpen = false;
  showMessage = false;
  showError = false;
  responseMessage = '';
  errorMessage = '';
  seats: any[] = [];
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      source: ['', Validators.required],
      destination: ['', Validators.required],
      date: ['', Validators.required],
      adult: [1],
      child: [0],
      infant: [0],
      travelClass: ['Economy']
    });

    this.httpService.suggestSource().subscribe({
      next: (data: any[]) => { this.sourceList = data.map(f => f.source); }
    });

    this.httpService.suggestDestination().subscribe({
      next: (data: any[]) => { this.destinationList = data.map(f => f.destination); }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  updateTravelerCount(type: string, delta: number): void {
    const ctrl = this.searchForm.get(type);
    if (ctrl) {
      const newVal = (ctrl.value || 0) + delta;
      if (newVal >= 0) ctrl.setValue(newVal);
    }
  }

  get travelerSummary(): string {
    const a = this.searchForm.get('adult')?.value || 0;
    const c = this.searchForm.get('child')?.value || 0;
    const i = this.searchForm.get('infant')?.value || 0;
    const cls = this.searchForm.get('travelClass')?.value;

    return `${a} Adult${a !== 1 ? 's' : ''}${c ? ', ' + c + ' Child' : ''}${i ? ', ' + i + ' Infant' : ''} - ${cls}`;
  }

  search(): void {
    if (this.searchForm.invalid) return;

    const { source, destination, date } = this.searchForm.value;

    this.httpService.searchFlights(source, destination, date).subscribe({
      next: (data) => {
        this.flights = data;
        this.showError = false;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Search failed.';
      }
    });
  }

  viewFlight(flight: any): void {
    this.selectedFlight = flight;

    const adult = this.searchForm.get('adult')?.value || 1;
    const child = this.searchForm.get('child')?.value || 0;
    const infant = this.searchForm.get('infant')?.value || 0;

    // ✅ ✅ ADD THIS BLOCK (IMPORTANT)
    const totalTravellers = adult + child + infant;
    localStorage.setItem('travellerCount', totalTravellers.toString());
    // ✅ ✅ END BLOCK

    this.totalPrice = this.totalPrice = flight.price;

    this.httpService.getSeats(flight.id).subscribe({

      next: (data) => {

        const selectedClass =
          this.searchForm.get('travelClass')?.value;

        // Dynamic filtering
        this.seats = data.filter((seat: any) => {

          const row = Number(seat.rowLabel);

          const totalRows =
            Math.ceil(data.length / 6);

          const firstClassRows =
            Math.max(1, Math.ceil(totalRows * 0.10));

          const businessRows =
            Math.max(2, Math.ceil(totalRows * 0.20));

          if (selectedClass === 'First') {
            return row <= firstClassRows;
          }

          if (selectedClass === 'Business') {
            return (
              row > firstClassRows &&
              row <= firstClassRows + businessRows
            );
          }

          // Economy
          return (
            row > firstClassRows + businessRows
          );
        });
      }
    });
  }

  // selectedSeats: any[] = [];

  onSeatSelected(seats: any[]): void {

    this.selectedSeats = seats;

    this.seatNumbers = seats
      .map(s => s.seatNumber)
      .join(',');

    // Calculate dynamic total
    this.calculateTotalPrice();
  }

  calculateTotalPrice(): void {

    if (!this.selectedFlight) return;

    const adult =
      this.searchForm.get('adult')?.value || 0;

    const child =
      this.searchForm.get('child')?.value || 0;

    const infant =
      this.searchForm.get('infant')?.value || 0;

    // Seat total
    const baseSeatTotal = this.selectedSeats.reduce(
      (sum, seat) => sum + seat.price,
      0
    );

    // Per passenger average
    const avgSeatPrice =
      this.selectedSeats.length > 0
        ? baseSeatTotal / this.selectedSeats.length
        : 0;

    // Final calculation
    this.totalPrice =
      (adult * avgSeatPrice) +
      (child * avgSeatPrice * 0.75) +
      (infant * avgSeatPrice * 0.5);

    // Travel class multiplier
    const travelClass =
      this.searchForm.get('travelClass')?.value;

    if (travelClass === 'Business') {
      this.totalPrice *= 1.8;
    }

    if (travelClass === 'First') {
      this.totalPrice *= 2.5;
    }

    this.totalPrice = Math.round(this.totalPrice);
  }

  bookSelectedFlight(): void {

    const userId = Number(this.authService.getUserId());

    const seatList = this.seatNumbers
      ? this.seatNumbers.split(',').map(s => s.trim())
      : [];

    // ✅ ✅ ADD THIS BLOCK (DO NOT REMOVE ANYTHING ELSE)
    const requiredSeats = Number(localStorage.getItem('travellerCount') || 1);

    if (seatList.length !== requiredSeats) {
      this.showError = true;
      this.errorMessage = `Please select exactly ${requiredSeats} seats`;
      return;
    }
    // ✅ ✅ END BLOCK

    this.httpService.bookSeats(this.selectedFlight.id, seatList, userId).subscribe({
      next: (res) => {
        this.showMessage = true;
        this.showError = false;
        this.responseMessage = 'Booking successful!';
      },
      error: (err) => {

        console.error('ERROR RESPONSE:', err);

        if (err.status === 200 || err.status === 204) {
          this.showMessage = true;
          this.showError = false;
          this.responseMessage = 'Booking successful!';
          return;
        }

        this.showError = true;
        this.errorMessage = err?.error?.message || 'Booking failed.';
      }
    });
  }
}