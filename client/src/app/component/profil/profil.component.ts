import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../../services/http.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {

  user: any = null;
  showError = false;

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // ✅ No login call here
    this.loadProfile();
  }

  loadProfile(): void {
    this.user = {
      username: localStorage.getItem('username') || '',
      role: this.authService.getRole,   // ✅ getter (correct)
      userId: this.authService.getUserId()
    };
  }
}