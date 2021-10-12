import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';

import { ENTITY_CONFIG, ENTITY_CONFIG_WIDGET } from '../enums/api.enums';

@Injectable()
export class EntitiesService {
  entitySubject: Subject<any>;
  entity: any;

  constructor(
    private http: HttpClient,
  ) {
    this.entitySubject = new Subject();
    this.entitySubject.subscribe(newEntity => this.entity = newEntity);
  }

  public getEntity(): Promise<any> {
    if (this.entity) return this.entity;
    return this.http.get(ENTITY_CONFIG).toPromise();
  }

  public updateEntity(entity: any): Promise<any> {
    return this.http.patch(ENTITY_CONFIG, entity).toPromise();
  }

  public updateWidgetAvailability(entity: any): Promise<any> {
    return this.http.patch(ENTITY_CONFIG_WIDGET, entity).toPromise();
  }
}
