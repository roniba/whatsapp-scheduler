import * as schedule from 'node-schedule';
import { getPendingMessages, updateMessageStatus, getSetting } from './db';
import { sendMessage, getStatus } from './whatsapp';

export function startScheduler() {
  // Run every minute
  schedule.scheduleJob('* * * * *', async () => {
    if (getStatus() !== 'ready') return;

    const messages = getPendingMessages();
    if (messages.length === 0) return;

    console.log(`[Scheduler] Processing ${messages.length} pending message(s)`);

    const notifyRecipient = getSetting('notification_recipient');
    const notifyRecipientName = getSetting('notification_recipient_name');

    for (const msg of messages) {
      try {
        await sendMessage(msg.recipient, msg.message, msg.media_path);
        updateMessageStatus(msg.id, 'sent', new Date().toISOString());
        console.log(`[Scheduler] Sent message ${msg.id} to ${msg.recipient_name ?? msg.recipient}`);

        if (notifyRecipient) {
          const to = msg.recipient_name ?? msg.recipient;
          const notification = `✅ Scheduled message sent successfully\n\nTo: ${to}\nMessage: ${msg.message}`;
          await sendMessage(notifyRecipient, notification);
          console.log(`[Scheduler] Notification sent to ${notifyRecipientName ?? notifyRecipient}`);
        }
      } catch (err) {
        updateMessageStatus(msg.id, 'failed');
        console.error(`[Scheduler] Failed to send message ${msg.id}:`, err);
      }
    }
  });

  console.log('[Scheduler] Started — checking every minute');
}
