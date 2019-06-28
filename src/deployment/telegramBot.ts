// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
process.env.NTBA_FIX_319 = '1';
// eslint-disable-next-line import/first
import TelegramBot from 'node-telegram-bot-api';

export interface SendMessageOptions {
  token: string;
  chatId: string;
  message: string;
}

export function sendMessage({
  token,
  chatId,
  message,
}: SendMessageOptions): Promise<TelegramBot.Message> {
  const bot = new TelegramBot(token);
  return bot.sendMessage(chatId, message);
}
