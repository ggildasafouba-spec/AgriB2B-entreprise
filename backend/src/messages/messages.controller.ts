import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  createConversation(
    @Body('participantId') participantId: string,
    @Body('orderId') orderId: string,
    @Request() req,
  ) {
    return this.messagesService.createConversation(req.user.id, participantId, orderId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste de mes conversations' })
  getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Messages d une conversation' })
  getConversationMessages(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.getThread(req.user.id, conversationId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  send(
    @Body('conversationId') conversationId: string,
    @Body('receiverId') receiverId: string,
    @Body('content') content: string,
    @Body('orderId') orderId: string,
    @Request() req,
  ) {
    const targetId = receiverId || conversationId;
    return this.messagesService.send(req.user.id, targetId, content, orderId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.id);
  }
}
