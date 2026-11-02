import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideFoundationTesting } from '../testing/test-providers';
describe('Application route shell', () => {
  it('lets each route control its own guest or authenticated layout', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: provideFoundationTesting(),
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('app-nav')).toBeNull();
  });
});
