function error(err: unknown): void {
  if (err instanceof Error) {
    console.error(err.stack || err.message);
    return;
  }

  console.error(err);
}

const logger = {
  error,
  info: console.info.bind(console),
  warn: console.warn.bind(console),
};

export default logger;
