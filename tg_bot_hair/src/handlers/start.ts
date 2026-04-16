import type { Context } from 'grammy';
import { prisma } from '../db';
import { consumeInviteToken, resetState, setState } from '../state';
import { adminMenu, masterMenu, roleSelectKeyboard } from '../keyboards';
import { buildAdminMenuText, buildMasterMenuText } from '../stats';

export async function handleStart(ctx: Context): Promise<void> {
  const chatId = ctx.chat!.id;
  const arg = (ctx.match as string | undefined) ?? '';

  // --- Master invite link: /start m_TOKEN ---
  if (arg.startsWith('m_')) {
    const token = arg.slice(2);
    const masterId = consumeInviteToken(token);

    if (!masterId) {
      await ctx.reply('❌ Ссылка недействительна или истекла. Попросите администратора выслать новую.');
      return;
    }

    const master = await prisma.master.findUnique({ where: { id: masterId } });
    if (!master) {
      await ctx.reply('❌ Мастер не найден в системе.');
      return;
    }

    await prisma.master.update({
      where: { id: masterId },
      data: { telegramId: BigInt(chatId) },
    });

    resetState(chatId);
    const menuText = await buildMasterMenuText(master.id);
    await ctx.reply(
      `Привет, ${master.name}! 👋 Вы подключены как мастер.\n\n${menuText}`,
      { parse_mode: 'HTML', reply_markup: masterMenu() },
    );
    return;
  }

  // --- Already registered? ---
  const admin = await prisma.admin.findFirst({ where: { telegramId: BigInt(chatId) } });
  if (admin) {
    resetState(chatId);
    const menuText = await buildAdminMenuText();
    await ctx.reply(
      `Привет, ${admin.name}! 👋\n\n${menuText}`,
      { parse_mode: 'HTML', reply_markup: adminMenu() },
    );
    return;
  }

  const master = await prisma.master.findFirst({ where: { telegramId: BigInt(chatId) } });
  if (master) {
    resetState(chatId);
    const menuText = await buildMasterMenuText(master.id);
    await ctx.reply(
      `Привет, ${master.name}! 👋\n\n${menuText}`,
      { parse_mode: 'HTML', reply_markup: masterMenu() },
    );
    return;
  }

  // --- Not registered ---
  await ctx.reply(
    'Добро пожаловать в Hair Atelier Bot! ✂️\n\nВыберите вашу роль:',
    { reply_markup: roleSelectKeyboard() },
  );
}

export async function handleMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat!.id;

  const admin = await prisma.admin.findFirst({ where: { telegramId: BigInt(chatId) } });
  if (admin) {
    const menuText = await buildAdminMenuText();
    await ctx.reply(menuText, { parse_mode: 'HTML', reply_markup: adminMenu() });
    return;
  }

  const master = await prisma.master.findFirst({ where: { telegramId: BigInt(chatId) } });
  if (master) {
    const menuText = await buildMasterMenuText(master.id);
    await ctx.reply(menuText, { parse_mode: 'HTML', reply_markup: masterMenu() });
    return;
  }

  await ctx.reply('Вы не зарегистрированы. Используйте /start');
}

export async function handleRegAdminCallback(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  setState(ctx.chat!.id, { step: 'awaiting_admin_secret' });
  await ctx.reply('Введите секретный код администратора:');
}

export async function handleRegMasterCallback(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    'Для подключения как мастер попросите администратора выслать вам персональную ссылку через бот.',
  );
}
