import type { Context } from 'grammy';
import { prisma } from '../db';
import { getState, resetState } from '../state';
import { adminMenu } from '../keyboards';

export async function handleTextInput(ctx: Context): Promise<void> {
  const chatId = ctx.chat!.id;
  const text = ctx.message?.text ?? '';
  const state = getState(chatId);

  if (state.step === 'awaiting_admin_secret') {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      await ctx.reply('⚠️ ADMIN_SECRET не настроен на сервере.');
      return;
    }

    if (text !== secret) {
      await ctx.reply('❌ Неверный код. Попробуйте снова или нажмите /start для отмены.');
      return;
    }

    // Find first admin without telegramId
    const admin = await prisma.admin.findFirst({
      where: { telegramId: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!admin) {
      // All admins already linked — check if this is a re-auth attempt
      const existing = await prisma.admin.findFirst({
        where: { telegramId: BigInt(chatId) },
      });
      if (existing) {
        resetState(chatId);
        await ctx.reply('Вы уже зарегистрированы как администратор.', {
          reply_markup: adminMenu(),
        });
      } else {
        await ctx.reply(
          '⚠️ Все аккаунты администраторов уже привязаны к другим Telegram-аккаунтам.\n' +
          'Обратитесь к владельцу системы.',
        );
      }
      return;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { telegramId: BigInt(chatId) },
    });

    resetState(chatId);
    await ctx.reply(
      `✅ Добро пожаловать, ${admin.name}!\nВы зарегистрированы как администратор.`,
      { reply_markup: adminMenu() },
    );
    return;
  }

  // Unknown state — show hint
  await ctx.reply('Используйте /menu для открытия главного меню.');
}
