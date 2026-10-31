import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '../../core/auth/auth.facade';
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  readonly auth = inject(AuthFacade);
}
