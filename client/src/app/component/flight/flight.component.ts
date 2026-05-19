import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn
} from '@angular/forms';

import { HttpService } from '../../../services/http.service';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, map, of } from 'rxjs';

@Component({
  selector: 'app-flight',
  templateUrl: './flight.component.html',
  styleUrls: ['./flight.component.scss']
})
export class FlightComponent implements OnInit {

  flightForm!: FormGroup;

  flights: any[] = [];

  showMessage = false;
  showError = false;
  errorMessage = '';

  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {

    this.flightForm = this.fb.group({


      flight_number: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(6)
        ],
        [this.flightNumberValidator()] // ✅ ASYNC VALIDATOR
      ],

      flight_name: ['', [Validators.required, Validators.minLength(3)]],

      source: ['', Validators.required],

      destination: ['', Validators.required],

      departureDate: ['', Validators.required],

      departureTime: ['', Validators.required],

      arrivalTime: ['', Validators.required],

      totalSeats: [60, [Validators.required, Validators.min(1)]],

      available_seats: [60, [Validators.required, Validators.min(0)]],

      price: [3000, [Validators.required, Validators.min(1)]],

      status: ['SCHEDULED', Validators.required],

      seats: this.fb.array([])

    }, {
      validators: this.sameSourceDestinationValidator
    });

    // Auto generate when seat count changes
    this.flightForm.get('totalSeats')?.valueChanges.subscribe(() => {
      this.generateSeats();
    });

    // Regenerate pricing if base price changes
    this.flightForm.get('price')?.valueChanges.subscribe(() => {
      this.generateSeats();
    });

    // Initial generation
    this.generateSeats();

    this.loadFlights();
  }

  get f() {
    return this.flightForm.controls;
  }

  get seats(): FormArray {
    return this.flightForm.get('seats') as FormArray;
  }

  // ====================================================
  // AUTO GENERATE AIRCRAFT SEATS
  // ====================================================

  generateSeats(): void {

    const totalSeats = Number(
      this.flightForm.get('totalSeats')?.value || 0
    );

    const basePrice = Number(
      this.flightForm.get('price')?.value || 0
    );

    if (!totalSeats || totalSeats <= 0) {
      return;
    }

    this.seats.clear();

    // Aircraft layout
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Total rows needed dynamically
    const totalRows = Math.ceil(totalSeats / columns.length);

    // Dynamic cabin allocation
    const firstClassRows = Math.max(1, Math.ceil(totalRows * 0.10));
    const businessRows = Math.max(2, Math.ceil(totalRows * 0.20));

    let generatedSeats = 0;
    let row = 1;

    while (generatedSeats < totalSeats) {

      for (let col = 0; col < columns.length; col++) {

        if (generatedSeats >= totalSeats) {
          break;
        }

        const seatLetter = columns[col];

        const seatNumber = `${row}${seatLetter}`;

        // =================================================
        // DETERMINE TRAVEL CLASS
        // =================================================

        let travelClass = 'Economy';

        if (row <= firstClassRows) {
          travelClass = 'First';
        }
        else if (row <= firstClassRows + businessRows) {
          travelClass = 'Business';
        }

        // =================================================
        // BASE SEAT PRICE
        // =================================================

        let seatPrice = basePrice;

        // Window seats
        if (seatLetter === 'A' || seatLetter === 'F') {
          seatPrice += 500;
        }

        // Aisle seats
        else if (seatLetter === 'C' || seatLetter === 'D') {
          seatPrice += 250;
        }

        // Middle seats
        else {
          seatPrice += 100;
        }

        // =================================================
        // CLASS PRICING
        // =================================================

        if (travelClass === 'Business') {
          seatPrice += 2000;
        }

        if (travelClass === 'First') {
          seatPrice += 5000;
        }

        // =================================================
        // EMERGENCY ROW
        // =================================================

        const emergencyRow =
          Math.floor(totalRows / 2);

        const isEmergencyRow =
          row === emergencyRow;

        if (isEmergencyRow) {
          seatPrice += 1000;
        }

        // =================================================
        // XL SEATS
        // =================================================

        const isXL =
          row === 1 ||
          row === emergencyRow;

        if (isXL) {
          seatPrice += 750;
        }

        // =================================================
        // CREATE SEAT
        // =================================================

        const seatGroup = this.fb.group({

          seatNumber: [
            seatNumber,
            Validators.required
          ],

          rowLabel: [
            row.toString(),
            Validators.required
          ],

          columnNumber: [
            col + 1,
            [Validators.required]
          ],

          price: [
            seatPrice,
            [Validators.required]
          ],

          isAvailable: [true],

          isBlocked: [false],

          isEmergencyExist: [isEmergencyRow],

          isXL: [isXL],

          // IMPORTANT
          travelClass: [travelClass]
        });

        this.seats.push(seatGroup);

        generatedSeats++;
      }

      row++;
    }

    this.flightForm.patchValue({
      available_seats: totalSeats
    }, { emitEvent: false });
  }



  // ====================================================
  // LOAD FLIGHTS
  // ====================================================

  loadFlights(): void {

    this.httpService.getAllFlights().subscribe({

      next: (data) => {
        this.flights = data;
      },

      error: () => {
        this.showError = true;
      }
    });
  }


  // ====================================================
  // SUBMIT
  // ====================================================

  onSubmit(): void {

    if (this.flightForm.invalid) {

      this.flightForm.markAllAsTouched();

      return;
    }

    console.log(this.flightForm.value);

    this.httpService.createFlight(this.flightForm.value).subscribe({

      next: () => {

        this.showMessage = true;

        this.showError = false;

        this.flightForm.reset({

          status: 'SCHEDULED',
          totalSeats: 60,
          available_seats: 60,
          price: 3000
        });

        this.seats.clear();

        this.generateSeats();

        this.loadFlights();
      },

      error: (err) => {

        console.error(err);

        this.showError = true;

        this.errorMessage =
          err?.error?.message ||
          'Failed to create flight.';
      }
    });
  }

  sameSourceDestinationValidator(
    group: AbstractControl
  ): ValidationErrors | null {

    const source =
      group.get('source')?.value
        ?.trim()
        ?.toLowerCase();

    const destination =
      group.get('destination')?.value
        ?.trim()
        ?.toLowerCase();

    if (
      source &&
      destination &&
      source === destination
    ) {
      return { sameLocation: true };
    }

    return null;
  }

  flightNumberValidator(): AsyncValidatorFn {
    return (control) => {

      if (!control.value) {
        return of(null);
      }

      return this.httpService.checkFlightNumber(control.value).pipe(

        debounceTime(300),

        map((exists: boolean) => {
          return exists ? { flightExists: true } : null;
        })

      );
    };
  }
}