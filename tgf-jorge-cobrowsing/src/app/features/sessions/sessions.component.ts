import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SocketService } from '../../shared/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionsComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private router = inject(Router);
  
  sessions = signal<any[]>([]);
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.setupSocketListeners();
    this.loadSessions();
  }

  private setupSocketListeners() {
    // Initial load response
    this.subscriptions.push(
      this.socketService.listen('sessions-recovered').subscribe((data: any) => {
        console.log('Sessions recovered event received:', data);
        if (data && data.result) {
          const flatSessions: any[] = [];
          data.result.forEach((clientData: any) => {
             if (clientData.sessions) {
               flatSessions.push(...clientData.sessions);
             }
          });
          console.log('Processed sessions:', flatSessions);
          this.sessions.set(flatSessions);
        }
      })
    );

    // New session event - Corrected to 'new-session'
    this.subscriptions.push(
      this.socketService.listen('new-session').subscribe((data: any) => {
        console.log('New session event:', data);
        // The payload for 'new-session' is { uid, session, total }
        if (data && data.session) {
          this.sessions.update(current => [data.session, ...current]); // Add to the top of the list
        }
      })
    );

    // Remove session event
    this.subscriptions.push(
      this.socketService.listen('remove-session').subscribe((data: any) => {
        console.log('Remove session event:', data);
        if (data && data.sessionId) {
          this.sessions.update(current => current.filter(s => s._id !== data.sessionId));
        }
      })
    );

    // Update session event
    this.subscriptions.push(
      this.socketService.listen('update-session').subscribe((updatedSession: any) => {
        // console.log('Update session event:', updatedSession); // Can be noisy
        if (updatedSession && updatedSession._id) {
          this.sessions.update(current => 
            current.map(s => s._id === updatedSession._id ? { ...s, ...updatedSession } : s)
          );
        }
      })
    );
  }

  private loadSessions() {
    console.log('Emitting search-sessions...');
    this.socketService.emit('search-sessions', { searchString: '', skip: 0, limit: 100 });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  connectToSession(session: any) {
    this.router.navigate(['/dashboard/cobrowsing', session._id]);
  }
}
