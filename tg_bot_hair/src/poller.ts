/**
 * Polls the DB every 30 seconds for new PENDING appointments
 * and sends a notification to all registered admins.
 */
import { Bot } from 'grammy';
import { prisma } from './db';
import { formatAppointment } from './formatters';
import { appointmentActionKeyboard } from './keyboards';

const POLL_INTERVAL_MS = 30_000;

export function startPoller(bot: Bot): void {
  // On startup: mark all existing appointments as notified so we don't spam history.
  // Only appointments created AFTER the bot starts will trigger notifications.
  silenceExistingAppointments().then(() => {
    setInterval(() => pollNewAppointments(bot), POLL_INTERVAL_MS);
  });
}

async function silenceExistingAppointments(): Promise<void> {
  try {
    const { count } = await prisma.appointment.updateMany({
      where: { telegramNotified: false },
      data: { telegramNotified: true },
    });
    if (count > 0) {
      console.log(`ℹ️  Marked ${count} existing appointment(s) as notified (startup silence).`);
    }
  } catch (err) {
    console.error('silenceExistingAppointments error:', err);
  }
}

async function pollNewAppointments(bot: Bot): Promise<void> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { telegramNotified: false },
      include: { master: true, service: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!appointments.length) return;

    const admins = await prisma.admin.findMany({
      where: { telegramId: { not: null } },
    });

    if (!admins.length) return;

    for (const appointment of appointments) {
      // Mark as notified first to avoid double-sending on error
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { telegramNotified: true },
      });

      const text =
        `🆕 <b>Новая запись!</b>\n\n${formatAppointment(appointment)}`;

      for (const admin of admins) {
        try {
          await bot.api.sendMessage(Number(admin.telegramId!), text, {
            parse_mode: 'HTML',
            reply_markup: appointmentActionKeyboard(appointment.id),
          });
        } catch (err) {
          console.error(
            `Failed to notify admin ${admin.id} (tg: ${admin.telegramId}):`,
            err,
          );
        }
      }
    }
  } catch (err) {
    console.error('Poller error:', err);
  }
}
