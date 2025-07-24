import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // Optionally, join a room by userId
    // client.on('join', (userId) => client.join(userId));
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(userId);
  }

  sendNotification(userId: string, notification: any) {
    this.server.to(userId).emit('notification', notification);
  }
}
