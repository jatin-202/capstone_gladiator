import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Seat } from '../../model/seat';
import { SeatService } from '../../services/seat.service';

@Component({
  selector: 'app-seat',
  templateUrl: './seat.component.html',
  styleUrls: ['./seat.component.scss']
})
export class SeatSelectionComponent implements OnInit, OnChanges {

  @Input() flightId!: number;
  @Input() seats: Seat[] = [];
  @Output() seatSelected = new EventEmitter<any[]>();
  seatMap: any[][] = [];
  selectedSeatNumber: string | null = null;
  selectedSeats: any[] = [];

  constructor(private seatService: SeatService) { }

  ngOnInit(): void {
    if (this.flightId) {
      this.seatService.getSeats(this.flightId).subscribe({
        next: (data) => { this.buildSeatMap(data); }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seats'] && changes['seats'].currentValue) {
      this.buildSeatMap(changes['seats'].currentValue);
    }
  }

  // Group seats by rowLabel to create a 2D grid
  buildSeatMap(seats: any[]): void {
    const rowMap: { [key: string]: any[] } = {};
    const rowOrder: string[] = [];
    for (const seat of seats) {
      const row = seat.rowLabel;
      if (!rowMap[row]) {
        rowMap[row] = [];
        rowOrder.push(row);
      }
      rowMap[row].push({ ...seat, booked: !seat.isAvailable });
    }
    this.seatMap = rowOrder.map(row => rowMap[row]);
  }
  getTotalRows(): number {

    return this.seatMap.length;
  }

  getFirstClassRows(): number {

    return Math.max(
      1,
      Math.ceil(this.getTotalRows() * 0.10)
    );
  }

  getBusinessRows(): number {

    return Math.max(
      2,
      Math.ceil(this.getTotalRows() * 0.20)
    );
  }

  isFirstClassRow(index: number): boolean {

    return index < this.getFirstClassRows();
  }

  isBusinessClassRow(index: number): boolean {

    return (
      index >= this.getFirstClassRows() &&
      index <
      this.getFirstClassRows() +
      this.getBusinessRows()
    );
  }

  isEconomyClassRow(index: number): boolean {

    return (
      index >=
      this.getFirstClassRows() +
      this.getBusinessRows()
    );
  }
  isSeatSelected(seatNumber: string): boolean {

    if (!this.selectedSeatNumber) {
      return false;
    }

    return this.selectedSeatNumber
      .split(',')
      .map(s => s.trim())
      .includes(seatNumber);
  }

  selectSeat(seat: any): void {

    if (seat.booked) return;

    const maxSeats = Number(
      localStorage.getItem('travellerCount') || 1
    );

    const existingIndex = this.selectedSeats.findIndex(
      s => s.seatNumber === seat.seatNumber
    );

    // REMOVE seat
    if (existingIndex > -1) {

      this.selectedSeats.splice(existingIndex, 1);

    } else {

      // LIMIT seat selection
      if (this.selectedSeats.length >= maxSeats) {

        alert(`You can select only ${maxSeats} seats`);

        return;
      }

      this.selectedSeats.push(seat);
    }

    // Update selected seat numbers
    this.selectedSeatNumber = this.selectedSeats
      .map(s => s.seatNumber)
      .join(',');

    // Emit FULL seats
    this.seatSelected.emit(this.selectedSeats);
  }
}