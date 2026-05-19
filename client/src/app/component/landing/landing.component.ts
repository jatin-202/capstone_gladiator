import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  static loaderShown = false;

  showLoader = false;
  fadeLoader = false;
  destinations: any[] = []

  userName: string = '';
  role: string = '';

  constructor(private router: Router, private flightService: FlightService) { }

  ngOnInit(): void {

    // ✅ fetch flights (already there)
    this.flightService.getAllFlights().subscribe(data => {
      this.destinations = data;
    });

    // ✅ ✅ ADD THIS (for user info)
    const user = localStorage.getItem('user');

    if (user) {
      const parsed = JSON.parse(user);
      this.userName = parsed.username;
      this.role = parsed.role;
    }

    // ✅ loader logic (already there)
    if (!LandingComponent.loaderShown) {
      this.showLoader = true;

      setTimeout(() => {
        this.fadeLoader = true;
      }, 2000);

      setTimeout(() => {
        this.showLoader = false;
        LandingComponent.loaderShown = true;
      }, 2800);

    } else {
      this.showLoader = false;
    }
  }

  // ✅ button navigation
  openSignIn(): void {
    this.router.navigate(['/login']);
  }

  scrollTo(section: string): void {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}