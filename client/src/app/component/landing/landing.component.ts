import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  static loaderShown = false;

  showLoader = false;
  fadeLoader = false;

  constructor(private router: Router) {}

  ngOnInit(): void {

    // ✅ show loader ONLY first time
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