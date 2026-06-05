import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import type { AppNotification, ConnectionMessage, UserConnection } from '@livin/common';
import { environment } from '../../environments/environment.local';

export interface NewMatchEvent {
  connectionId: string;
  otherUser: { name: string; photo: string };
}

export interface NewMessageEvent {
  connectionId: string;
  message: ConnectionMessage;
}

// Strip /api suffix to get the socket server root URL.
const SOCKET_URL = environment.apiUrl.replace(/\/api$/, '');

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  readonly newMatch$ = new Subject<NewMatchEvent>();
  readonly newMessage$ = new Subject<NewMessageEvent>();
  readonly connectionUpdated$ = new Subject<UserConnection>();
  readonly newNotification$ = new Subject<AppNotification>();

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(SOCKET_URL, { withCredentials: true });
    this.socket.on('new-match', (data: NewMatchEvent) => this.newMatch$.next(data));
    this.socket.on('new-message', (data: NewMessageEvent) => this.newMessage$.next(data));
    this.socket.on('connection-updated', (data: UserConnection) => this.connectionUpdated$.next(data));
    this.socket.on('new-notification', (data: AppNotification) => this.newNotification$.next(data));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
