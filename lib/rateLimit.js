// Memory store untuk melacak kegagalan login per IP
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5; // Maksimal 5 kali salah
const LOCK_TIME_MS = 15 * 60 * 1000; // Dikunci 15 menit

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  // Reset jika masa penguncian sudah berlalu
  if (now - record.firstAttemptTime > LOCK_TIME_MS) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingSeconds = Math.ceil(
      (LOCK_TIME_MS - (now - record.firstAttemptTime)) / 1000
    );
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return {
      allowed: false,
      remainingMinutes,
      message: `Terlalu banyak percobaan salah. Terkunci sementara, silakan coba lagi dalam ${remainingMinutes} menit.`,
    };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttemptTime: now };

  if (now - record.firstAttemptTime > LOCK_TIME_MS) {
    record.count = 1;
    record.firstAttemptTime = now;
  } else {
    record.count += 1;
  }

  loginAttempts.set(ip, record);
  return MAX_ATTEMPTS - record.count;
}

export function resetAttemptCount(ip) {
  loginAttempts.delete(ip);
}
