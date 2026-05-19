import { Component, OnInit } from "@angular/core";
import { FlightService } from "../../services/flight.service";

@Component({
    selector: 'app-explore-flights',
    templateUrl: './explore-flights.component.html',
    styleUrls: ['./explore-flights.component.scss']
})
export class ExploreFlightsComponent implements OnInit {

    flightsList: any[] = [];

    constructor(private flightService: FlightService) { }

    ngOnInit(): void {
        this.flightService.getAllFlights().subscribe(data => {
            console.log("API DATA:", data); // ✅ ADD THIS
            this.flightsList = data;
        });
    }

    bookNow(flight: any) {
        const isLoggedIn = localStorage.getItem('user');

        if (!isLoggedIn) {
            alert('Login required to book flights');
        } else {
            console.log('Proceed booking', flight);
        }
    }
}
