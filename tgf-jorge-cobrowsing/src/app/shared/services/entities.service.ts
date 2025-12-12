import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EntitiesService {
  entity = signal<any>({
    companyName: 'Example Corp',
    companySite: 'example.com',
    companyPhone: '123-456-7890',
    companyEmail: 'contact@example.com',
  });

  constructor() {}
}
