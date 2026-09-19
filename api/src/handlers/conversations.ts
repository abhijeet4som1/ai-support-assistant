import {
  type CreateConversation,
  type GetConversation,
  type ListConversations,
  type SendMessage,
} from '@app/api-server-sdk';

import { authed, must, type HandlerContext } from './context.js';
import { type ConversationsService } from '../conversations/service.js';

export function conversationHandlers(conversations: ConversationsService) {
  const CreateConversationOp: CreateConversation<HandlerContext> = authed(async (input, ctx) => ({
    conversation: await conversations.create(must(input.companyId, 'companyId'), ctx.user.id),
  }));

  const ListConversationsOp: ListConversations<HandlerContext> = authed((input, ctx) =>
    conversations.list({
      userId: ctx.user.id,
      companyId: input.companyId,
      coverage: input.coverage,
      cursor: input.cursor,
      limit: input.limit,
    }),
  );

  const GetConversationOp: GetConversation<HandlerContext> = authed((input, ctx) =>
    conversations.get(must(input.conversationId, 'conversationId'), ctx.user.id, {
      before: input.before,
      limit: input.limit,
    }),
  );

  const SendMessageOp: SendMessage<HandlerContext> = authed((input, ctx) =>
    conversations.sendMessage({
      conversationId: must(input.conversationId, 'conversationId'),
      kind: must(input.kind, 'kind'),
      content: must(input.content, 'content'),
      userId: ctx.user.id,
    }),
  );

  return {
    CreateConversation: CreateConversationOp,
    ListConversations: ListConversationsOp,
    GetConversation: GetConversationOp,
    SendMessage: SendMessageOp,
  };
}
