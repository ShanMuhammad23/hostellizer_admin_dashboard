let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  return audioContext;
}

function playTone(
  frequencies: number[],
  duration = 0.12,
  gap = 0.06,
  volume = 0.12
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().catch(() => undefined);

  let time = ctx.currentTime;
  for (const frequency of frequencies) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
    time += duration + gap;
  }
}

export function unlockChatAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
}

export function playMessageSentSound() {
  playTone([880, 1175], 0.08, 0.04, 0.1);
}

export function playMessageReceivedSound() {
  playTone([523, 659, 784], 0.1, 0.05, 0.14);
}

export async function requestChatNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showChatNotification(options: {
  title: string;
  body: string;
  tag?: string;
  onClick?: () => void;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(options.title, {
    body: options.body,
    tag: options.tag,
  });

  notification.onclick = () => {
    window.focus();
    options.onClick?.();
    notification.close();
  };
}

export function notifyMessageSent(studentName: string, content: string) {
  playMessageSentSound();
  showChatNotification({
    title: "Message sent",
    body: `To ${studentName}: ${content}`,
    tag: "chat-message-sent",
  });
}

export function notifyMessageReceived(
  senderName: string,
  content: string,
  chatId: string,
  messageId: string,
  onClick?: () => void
) {
  playMessageReceivedSound();
  showChatNotification({
    title: senderName,
    body: content,
    tag: `chat-${chatId}-${messageId}`,
    onClick,
  });
}
