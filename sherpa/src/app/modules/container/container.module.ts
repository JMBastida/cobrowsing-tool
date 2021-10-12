import { NgModule } from '@angular/core';

import { ContainerRoutingModule } from './container-routing.module';

import { UsersComponent } from './users/users.component';
import { ContainerComponent } from './container.component';
import { SessionsComponent } from './sessions/sessions.component';
import { SettingsComponent } from './settings/settings.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactCenterComponent } from './contact-center/contact-center.component';
import { SessionListItemComponent } from './sessions/session-item/session-item.component';

import { SharedModule } from '../shared/shared.module';
import { UsersService } from '../shared/services/user.service';
import { FontsService } from '../shared/services/fonts.service';
import { SupportService } from '../shared/services/support.service';
import { EntitiesService } from '../shared/services/entities.service';
import { SessionsService } from '../shared/services/sessions.service';

import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';
import { SpinnerModule } from 'primeng/spinner';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ColorPickerModule } from 'primeng/colorpicker';
import {ToggleButtonModule} from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { SessionsTabsViewComponent } from './sessions/sessions-tabs/sessions-tabs.component';
@NgModule({
  declarations: [
    UsersComponent,
    DashboardComponent,
    ContainerComponent,
    ContactCenterComponent,
    SessionsComponent,
    SettingsComponent,
    SessionListItemComponent,
    SessionsTabsViewComponent,
  ],
  imports: [
    TagModule,
    TableModule,
    SharedModule,
    DialogModule,
    SliderModule,
    SpinnerModule,
    SidebarModule,
    TooltipModule,
    TabViewModule,
    DropdownModule,
    CalendarModule,
    CheckboxModule,
    InputTextModule,
    PaginatorModule,
    FileUploadModule,
    RadioButtonModule,
    InputSwitchModule,
    MultiSelectModule,
    ProgressBarModule,
    ColorPickerModule,
    InputNumberModule,
    ToggleButtonModule,
    SelectButtonModule,
    InputTextareaModule,
    ConfirmDialogModule,
    ContainerRoutingModule,
  ],
  providers: [
    UsersService,
    FontsService,
    SupportService,
    SessionsService,
    EntitiesService,
    ConfirmationService,
  ]
})
export class ContainerModule { }
