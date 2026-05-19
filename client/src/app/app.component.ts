import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  userName: string = '';

  ngOnInit(): void {
    const name = localStorage.getItem('username') || '';
    this.userName = name.charAt(0).toUpperCase() + name.slice(1);

  }

  get role(): string {
    return localStorage.getItem('role') || '';
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.clear();
    location.reload();
  }
}