export async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram] Bot not configured, skipping notification');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error);
    return false;
  }
}

export function formatAppointmentNotification(appointment, service, master) {
  const date = new Date(appointment.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `
📋 <b>Новая запись!</b>

👤 <b>Клиент:</b> ${appointment.clientName}
📞 <b>Телефон:</b> ${appointment.clientPhone}
${appointment.clientEmail ? `📧 <b>Email:</b> ${appointment.clientEmail}` : ''}
📅 <b>Дата:</b> ${date}
🕐 <b>Время:</b> ${appointment.time}
${service ? `💇 <b>Услуга:</b> ${service.name}` : ''}
${master ? `✂️ <b>Мастер:</b> ${master.name}` : ''}
${appointment.comment ? `💬 <b>Комментарий:</b> ${appointment.comment}` : ''}
  `.trim();
}

export function formatEnrollmentNotification(enrollment, course) {
  return `
🎓 <b>Запись на курс!</b>

👤 <b>Имя:</b> ${enrollment.name}
📞 <b>Телефон:</b> ${enrollment.phone}
${enrollment.email ? `📧 <b>Email:</b> ${enrollment.email}` : ''}
📚 <b>Курс:</b> ${course.title}
${course.startDate ? `📅 <b>Начало:</b> ${new Date(course.startDate).toLocaleDateString('ru-RU')}` : ''}
  `.trim();
}
