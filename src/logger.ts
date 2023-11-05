import chalk from "chalk";

export const Logger = {
  success(...message: unknown[]) {
    return console.log(chalk.greenBright(message));
  },
  info(...message: unknown[]) {
    return console.log(chalk.cyan(message));
  },
  warn(...message: unknown[]) {
    return console.log(chalk.yellow(message));
  },
  error(...message: unknown[]) {
    return console.log(chalk.redBright(message));
  },
};
