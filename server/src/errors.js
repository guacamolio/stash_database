export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Nederīgs ID');
  return n;
}

// Turns a UNIQUE constraint failure into a friendly 409.
export function onUnique(fn, message) {
  try {
    return fn();
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new HttpError(409, message);
    throw e;
  }
}
